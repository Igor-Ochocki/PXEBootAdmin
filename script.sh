#!/bin/sh
# lab1
# Status i sterowanie AMT maszyn
# ato 2008-2024

# TODO gdy otwarta jest sesja KVM i maszyna usypia to po obudzeniu prędkość interefjsu 100M ??

# Rekwizyty: rmcpping arp-ping

# https://software.intel.com/sites/manageability/AMT_Implementation_and_Reference_Guide/default.htm

# TODO użyć RMCP_ping - szybsza odpowiedź ?
# Remote Management and Control Protoco

# Zależności: (perl)
#  /usr/local/bin/amttool        11K     408l
#  /usr/local/bin/amttool-tng   220K    6593l   SorceForge 2020-07-09  1.7.4
#
# usage: amttool <hostname> [ <command> ] [ <arg(s)> ]
#  info            - print some machine info (default).
#  reset           - reset machine.
#  powerup         - turn on machine.
#  powerdown       - turn off machine.
#  powercycle      - powercycle machine.
#  netinfo         - print network config.
#  netconf <args>  - configure network (check manpage).
# Password is passed via AMT_PASSWORD environment variable.

# amttool 1.7.4   Can talk to Intel AMT managed devices (SOAP-based version).
#
# Usage: amttool [<params>]  <hostname>[:<port>]  <command> [help|<cmd_params>]
# Parameters (before the hostname): --force|-f, --quiet|-q, --debug|-d, --ddebug|-dd
#
# <command>:
#   help     - detailed commands help (except remote control)
#   info     - general,audit,remote info (default command when only hostname given)
#   net      - iAMT device network administration
#   time     - get/sync iAMT device time
#   user     - access control management for an admin
#   uuser    - user access control (set own passwd, del special permissions)
#   hwasset  - prints hardware asset data
#   audit    - Access Monitor/Audit (AMT ver. 4.0+)
#   event    - platform events: configure, view log, subscribe
#   security - some commands from Security Administration interface
#   pwr_save - power saving management
#   redirect - IDE-Redirection settings and log
#   rem_control - remote power and boot control and info
#
# Use 'amttool help' to get the full detailed help.
#
# Environment variables:
#   AMT_USER - AMT username ('admin' if not set)
#   AMT_PASSWORD - AMT Password
#   AMT_VERSION  - to skip AMT version check (no access to GeneralInfo realm, etc.)
#   AMT_TIMEOUT - set connection timeout
#   HTTP_proxy - link to proxy in format: http://[proxy_user:pass@]<proxy_addr>:<port>

# Doc:
#  Tablica przejść (rozkazy dla różnych wersji AMT i stanu Sx maszyny):
#  Intel%2528R%2529_AMT_Release_7.0_SP1_SDK_PV_-_3696/DOCS/Implementation%20and%20Reference%20Guide/default.htm

# https://community.intel.com/t5/Intel-Business-Client-Software/AMT-and-FreeBSD-scripts/td-p/961161

DOMAIN='zet.pw.edu.pl'                          # XXX
SECUREDIR=${SECUREDIR:-/etc/securedir}          # Securedir for getpass
AMT_ADMIN=${AMT_USER:-admin}                    # AMT admin user
AMT_TIME=1                                      # [s]

AMT_off='sd se'                                 # Maszyny bez AMT
LAB_OFF="$HOME/.lab-off"                        # Lista wyłączonych maszyn (ref: lab1) do $LAB_OFF

amttool=/usr/local/bin/amttool                  # Port: comms/amtterm

GREEN='\e[32m' ; RED='\e[31m' ; YELLOW='\e[33m' ; BLUE='\e[34m' ; NOR='\e[m'

usage () { #
  echo "użycie: $PROG -opcje maszyna polecenie # Zarządzanie stacją przez AMT
Polecenia:
   '' : ?
  sta : status maszyny (on/off/sleep)
  ver : wersja AMT

 ping : ping
  arp : ARP ping
  amt : AMT ping (rmcpping)
  ifs : interface speed (switch port speed)

power : wake on off reset cycle suspend onhd shutdown

Ustawienia AMT:

 boot {hd,pxe} : start z hd/pxe
 ping {on,off} : odpowiadanie na ping
 pass [pass] : hasło"
  warn -G 'LAB_OFF=' "$LAB_OFF"                 # Wyłączone
  warn -G 'LAB_AMT=' "$LAB_AMT"                 # Bez AMT
  exit
}

root () { #
  [ $(id -un) = root ] || fatal "you must be root"
}

in_list () { # list elem                        # Test if elem is on the $list
  local l
  eval l=\$$1
  l=" $l "                                      # Otoczenie spacjami
  test "${l%%* $2 *}" = ""                      # Jest na liscie
}

Get_pass () { # user[@host]
  local pass config
  [ "$getpass" ] && { pass=$getpass ; return ;}
  config=$SECUREDIR/lab
  [ -r $config ] || root
  pass=$(grep "^$1" $config)
  pass=${pass#* }                               # Skip user[@host]
  echo "$pass"
}

Set_pass () {
  local newpass t t2
  if [ -n "$3" ]; then
    newpass="$3"
  else
    stty -echo
    printf "Nowe haslo: "
    read newpass
    stty echo
    printf "\n"
  fi
  t=$($CURL -b pwcookieaccept=accept http://$1:16992/acl.htm | grep 'ACTION="/user.htm"' | grep 'NAME="t"')
  t=${t#*value=\"}
  t=${t%\">}

  t2=$($CURL -b pwcookieaccept=accept --data-urlencode "t=$t" --data-urlencode "UserSubmit=Change Admin..." http://$1:16992/user.htm | grep 'NAME="t"')
  t2=${t2#*value=\"}
  t2=${t2%\">}

  $CURL -b pwcookieaccept=accept -d UserName=admin -d AdminSubmit=Submit --data-urlencode "t=$t2" --data-urlencode "UserPwd=$newpass" --data-urlencode "UserPwd2=$newpass" http://$1:16992/adminform
}

RMCP_ping () { # host                           # od AMT 6.0 Remote Management and Control Protocol
  # https://software.intel.com/sites/manageability/AMT_Implementation_and_Reference_Guide/default.htm?turl=WordDocuments%2Fusermcppingtodeterminetheplatformstate.htm
  # freeipmi-tools: /usr/sbin/rmcpping lub openipmi: /usr/bin/rmcp_ping
  rmcpping -c1 -t1 $1  -v                       # freeipmi-tools
}

Test_AMT () { # host
  in_list AMT_off $1 || return 0                # Aktualnie bez AMT
  echo "${RED}no AMT$NOR"  "ssh $1 sudo reboot"
  return 1
}

Power () { # host [st*|pw*|on|of*|cy*]          # Moc
  case "$2" in
  s*|p*) Power_st $1 ;; # status
     on) Power_on $1 ;; # on
    of*) Power_of $1 ;; # off
    cy*) Power_cy $1 ;; # cycle
  esac
}

Power_st () { # host                            # Stan
  local resp
  local i
  local host=$1
  if in_list LAB_off $1 ; then                  # Aktualnie wyłączone z listy
    resp="${RED}off$NOR"
  elif in_list AMT_off $1 ; then                # Aktualnie bez AMT
    resp="${RED}amt$NOR"
  else
    for i in 1 2 ; do                           # 2 próby
      resp=$($CURL "http://$1:16992/index.htm")
      case $? in
       7) break ;;                              # Failed to connect - connection refused
      28) break ;;                              # Timeout after -m <milisec>
      esac
      resp=$(echo "$resp" | grep -A1 '<p>Power' | tail -1 | sed 's/.*r1>//;s/<.*//')
      #resp=$(echo "$resp" | sed -n '/<p>Power/{n;s/.*r1>//;s/<.*//p;}')
      # 8.1.71
        #<tr>
        #<td class=r1><p>Power</p></td>
        #<td class=r1>On</td>
        #</tr>
      # 7.1.52
        #<tr>
        #  <td class=r1><p>Power
        #  <td class=r1>On
        #<tr><td>
      [ "$resp" ] && break
      #sleep 1
    done
    resp=${resp#  }                             # Stara wersja daje ' Off' (z 2 spacjami)
  fi
  [ "$resp" ] && echo "$resp"
}

Power_of () { # host                            # Wyłączenie
  Test_AMT  $1 || return
  Test_host $1 && return
  #menuboot $1 1 1
  echo 'y' | $amttool $1 powerdown >/dev/null && echo 'power-off'
}

Power_on () { # host                            # Włączenie
  Test_AMT  $1 || return
  #menuboot $1 2 1
  # TODO s5 500 Can't connect to s5:16992 (No route to host) at /usr/local/bin/amttool line 126.
  echo 'y' | $amttool $1 powerup >/dev/null && echo 'power-on'
}

Power_cy () { # host                            # OFF + ON
  Test_AMT  $1 || return
  Test_host $1 && return
  menuboot $1 3 1
  echo 'power cycle (off+on)'
}

Wakeup () { # host
  Test_AMT  $1 || return
  # TODO testsleep
  menuboot $1 2 1 &&                            # XXX Jak - jest specjalny wake ? (na razie jak boot_normal)
  echo 'wakeup'
  # wakes intel AMT enabled host in GE510, hostname is a parameter:
  #curl --insecure --anyauth --user "admin:pass" -d amt_html_rc_radio_group=2 -d amt_html_rc_boot_special=1 http://$HOST:16992/remoteForm
}

Reset () { # host                               # RESET
  Test_AMT  $1 || return
  Test_host $1 && return
  # Jeśli jest sleep to trzeba najpierw obudzić przez 'ON'
  #Wakeup $1                                    # Wake

  #menuboot $1 4 1
  echo 'y' | $amttool $1 reset >/dev/null && { echo 'reset' ; return ;}

  #s1 500 Can't connect to s1:16992 (Connection refused) at /usr/local/bin/amttool line 126.
  echo 'y' | $amttool $1 reset >/dev/null && echo 'reset'
}

menuboot () { # host x y
  Test_AMT  $1 || return
  $CURL -d amt_html_rc_radio_group=$2 -d amt_html_rc_boot_special=$3 http://$1:16992/remoteForm
}

#               1     2     3     4
boot_os () { # host "boot" [os] [ver] [-t x]    # Podniesienie konkretnego systemu np. s14 boot freebsd
  local old
  Test_AMT  $1 || return
  host=${1%m}                                   # Bez przyrostka m
  [ "$3" ] && boot -t 30s $host $3 >/dev/null   # Bez komunikatu, 30sek wystarcza
  echo 'y' | $amttool $1 powerup >/dev/null &&  # TODO czasami nie dziala
  echo "boot $3"
}

Set_boot () { # host hd|pxe                     # Boot HD
  case "$1" in
   '') boot_os  $* ;;
   hd) menuboot $1 2 3 && echo 'boot HD' ;;
  pxe) boot_pxe $* ;;
  esac
}

boot_pxe () { # host [ system ]                 # Boot PXE
  Test_AMT  $1 || return
  #[ "$3" ] && /usr/local/sbin/dhcp-boot -r $3 $4 # XXX robic dhcp.reload dla kazdej stacji
  #menuboot $1 2 5
  echo 'y' | $amttool $1 powerup pxe >/dev/null && # XXX dodac time-out gdy nie odpowiada
  echo 'boot PXE'
}

Suspend () { # host                             # Suspend
  Test_host $1 && return
  host=${1%m}                                   # Bez przyrostka m
  #ssh $host sudo systemctl suspend
  unix $host sudo systemctl suspend             # -i ? :
  #stud@s1:~$ systemctl suspend
  #User utnickir is logged in on sshd.
  #Please retry operation after closing inhibitors and logging out other users.
  #Alternatively, ignore inhibitors and users with 'systemctl suspend -i'.
  # https://wiki.debian.org/Suspend
  # https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/7/html/system_administrators_guide/sect-managing_services_with_systemd-power
  # https://blog.christophersmart.com/2016/05/11/running-scripts-before-and-after-suspend-with-systemd/
}

If_speed () { # host                            # Prędkość interfejsu portu przełącznika
  case "$1" in
  s[0-9]*|s[abcdef]) snmp-ifspeed $1 ;;         # Tylko na tych portach
  #k[123456789c]|s[0-9]*) snmp-ifspeed $1 ;;    #
  *) fatal 'brak możliwości odczytu portu przełącznika dla:' " $1"
  esac
}

amt_test () { # host                            # Sprawdzenie czy jest AMT (max 4s)
  arp-ping $1 -c1 || return 1                   # ARP - czekamy max. 1s
  rmcpping -c1 -t1 $1 > /dev/null && return     # (1) gdy brak
  rmcpping -c1 -t1 $1 > /dev/null && return
  rmcpping -c1 -t1 $1 > /dev/null && return
  rmcpping -c1 -t1 $1 > /dev/null && return     # Czasami odpowiada dopiero po kilku sek.
}

amt_ping () { # host
  amt_test $1 &&  echo OK || echo 'brak AMT'
}

amt_ver () { # host                             # Get AMT version
  local i
  Test_AMT  $1 || return
  for i in 1 2 ; do                             # 2 próby
    VER=$($CURL "http://$1:16992/index.htm")
    case $? in
     7) break ;;                                # Failed to connect
    28) break ;;                                # Timeout
    esac
    VER=${VER##*version: } ; VER=${VER% *}
    [ "$VER" ] && break
    sleep 1                                     # XXX proteza dla AMT 8.1.20
  done
  VER=${VER%-build}                             # 3.0.2-build, 5.1.0-build, 8.1.20-build, 8.1.71-build 3608
  if [ "$VER" ]; then
    echo "$VER"
  else
    echo $RED'no AMT'$NOR                       # Nie odpowiada
  fi
}

Set_ping () { # on/off
  case "$1" in
   on) shift ; Set_ping_on $* ;;
  off) shift ; Set_ping_of $* ;;
    *) fatal 'ping on/off : ' "$*" ;;
  esac
}

Set_ping_on () { # host
  local DATAENC HDNAME t
  Test_AMT  $1 || return
  case "$1" in
  s*|k*)
    t=$($CURL -b pwcookieaccept=accept http://$1:16992/ip.htm | grep 'NAME="t"')
    t=${t#*value=\"}; t=${t%\">}
    DATAENC="--data-urlencode t=$t" ;;
  *)
    HDNAME="-d HostName=$1 -d DomainName=$DOMAIN" ;;
  esac
  $CURL -d command=command1 -d RespondPing=on $DATAENC $HDNAME  http://$1:16992/ipform
  echo ' pings ON'
}

Set_ping_of () { # host
  local DATAENC HDNAME t
  Test_AMT  $1 || return
  case "$1" in
  s*|k*)
    t=$($CURL -b pwcookieaccept=accept http://$1:16992/ip.htm | grep 'NAME="t"')
    t=${t#*value=\"}; t=${t%\">}
    DATAENC="--data-urlencode t=$t" ;;
  *)
    HDNAME="-d HostName=$1 -d DomainName=$DOMAIN" ;;
  esac
  $CURL -d command=command1 $DATAENC $HDNAME  http://$1:16992/ipform
  echo ' pings off'
}

shutd () { # cmd.... host                       # Dla Windows host musi być IP/WINS (alias DNS nie działa - np. s01 i s1)
  Test_host $1 && return
  local zwloka=60                               # w sek.
  local komunikat="$SUDO_USER wyłączył maszynę zdalnie"
  eval host=\$$#                                # Ostatni argument XXX NIS?
  wincmd $host "shutdown -s -t $zwloka -c $komunikat"
  #root
  #net rpc shutdown $host
  #/usr/local/libexec/nagios/event_generic.pl -c "/usr/bin/net rpc shutdown -t 300 -f -r -C 'This computer is being rebooted by Nagios' -U $USR%$PAS -I $HOS"
}

xping () { # host
  echo ' ping \c'
  if ping -q -W 200 -c1 $1 >/dev/null ; then    # XXX v1Alarm clock
    echo 'OK'                                   # Odpowiada
  else
    echo $RED'--'$NOR                   # Nie odpowiada
  fi
}

arp_ping () { # host                            # ARP-ping
  case "$(uname)" in
  FreeBSD) arping="/usr/local/sbin/arping -W.1 -c1" ;;  # XXX v1Alarm clock
    Linux) arping="arping -qf -c3 -w1" ;;
  esac
  $E $sudo $arping $1 >/dev/null
  case "$?" in
  0) echo 'OK' ;;                               # Odpowiada
  *) echo $RED'--'$NOR ;;                       # Nie odpowiada
  esac
}

Prompt () { # message
  local Y
  [ -t 0 ] || return 1
  read -p "$1 [N/y] : " Y
  [ "$Y" = "" -o "$Y" = "n" ] || return 1
}

Test_host () { # host $cmd                      # Selftest
  local host IP YN
  host=${SSH_CLIENT%% *}                        # SSH_CLIENT=78.131.246.192 23766 22
  IP=$(dig $1.$DOMAIN +short | tail -1)
  if [ "$IP" = "$host"  ]; then
    warn -R "jesteś zalogowany z maszyny $host" "czy rzeczywiście chcesz $cmd \c"
    Prompt "" && return 0
  fi
  return 1
}

Pinger () { # host
 if ping -q -W200 -c1 $s >/dev/null ; then      # Odpowiada
   if [ "$cmd" ] ; then
     $cmd $s "$args"
   else
     echo ' ON'
   fi
 else
   echo $RED' --'$NOR                   # Nie odpowiada
 fi
}

. ZLIB

# START

PROG=${0##*/}

echo "$(date +%T) : $*" >> /tmp/$PROG.log       # XXX czasowo

#if true ; then # -opcje z końca na początek
  _n=$# _N=$#
  while [ $((_n-=1)) -gt 0 ] ; do
    eval _a=\${$_N}
    case "$_a" in
    -?*) _i=$#
        while [ $((_i-=1)) -gt 0 ]; do
          set -- "$@" "$1"
          shift
        done ;;
     *) break ;;
    esac
  done
  unset _n _N _i _a
#fi

export UNAME=$(uname)                           # Linux/FreeBSD

[ '' = "$(echo -e)" ] && alias echo='echo -e'   # echo -e ?

[ $(id -un) = root ] || sudo=sudo

[ "$LAB_off" ] || LAB_off="$(cat $LAB_OFF 2>/dev/null)" # Wyłączone maszyny (export w =lab)

E=
v=
S=
while getopts lnSvxh opt ; do # $OPTARG
  case "$opt" in
  l) log=yes ;;                                 # log
  n) E=echo ;;
  S) S=-S ;;                                    # curl -S
  v) v=-v ;;                                    # curl -v
  x) x=-x ; set $x ;;
  ?) usage ;;
  esac
done
shift $((OPTIND-1))

[ -z "$1" ] && usage

s=$1 ; shift
case "$s" in s[0-9abcd]*) s=${s%m} ; esac       # Nie dopisujemy m. Było: s=${s%m}m

export AMT_PASSWORD="$(Get_pass $AMT_ADMIN)"    # Dla amtterm

opt="$v $S --retry 5 --retry-delay 1 --retry-all-errors --retry-connrefused"

CURL="$E curl -sfkL $opt -m $AMT_TIME --anyauth -u '$AMT_ADMIN:$AMT_PASSWORD'"  # XXX dlaczgo nie działa $(CURL ...) ??
CURL="$E curl -sfkL $opt -m $AMT_TIME --anyauth -u $AMT_ADMIN:$(Get_pass $AMT_ADMIN)"

# XXX system na docelowej maszynie - od tego zależy cmd

case "$1" in
#diag:
     '') cmd=Pinger     ;;
    arp) cmd=arp_ping   ;;                      # ARP ping
    amt) cmd=amt_ping   ;;                      # Jest AMT ?
    ver) cmd=amt_ver    ;;                      # Werjsa AMT
   ifs*) cmd=If_speed   ;;
#power:
st*|pw*|on|of*|cy*) cmd=Power ;;                # Status|on|off|cycle
  reset) cmd=Reset      ;;
    wa*) cmd=Wakeup     ;;
sl*|su*) cmd=Suspend    ;;                      # sleep=suspend
#amt:
   boot) cmd=Set_boot   ;;                      # system | hd | pxe
   pass) cmd=Set_pass   ;;                      # Zmiana hasła
   ping) cmd=Set_ping   ;;
#os:
  shut*) cmd=shutd      ;;
#winoff) cmd="wincmd 'shutdown /s /t 20'" ;;    # //l01 ! ping ustaje po 45s
#   ww) cmd="wincmd 'who'" ;;
#    *) cmd="unix" ; args="$*" ;;
#  pas) cmd=Get_pass    ;;
     *) fatal 'lab1: nieznane polecenie: ' "$*" ;;
esac

trap "exit 0" HUP INT QUIT TERM

[ -t 1 ] && echo $GREEN"${s%m}"$NOR \\c

$cmd $s $*

exit