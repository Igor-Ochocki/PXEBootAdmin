#!/bin/sh
# lab
# Sterowanie + info AMT
# ato 2011-2024

# TODO ^C nie przerywa procesów potomnych
# TODO gdy użytkownik nie ma hasła to tylko ping

# Przykład ze stdin:
#   USER=  PAS=
#   echo "echo -e '$PAS\n$PAS' | sudo passwd $USR" | lab s3 ssh

RED='\e[31m' ; GRE='\e[32m' ; YEL='\e[33m' ; BLU='\e[34m' ; MAG='\e[35m' ; CYA='\e[36m' ; NOR='\e[m'

# Bold:
#RED='\e[1;31m' ; GRE='\e[1;32m' ; YEL='\e[1;33m' ; BLU='\e[1;34m' ; MAG='\e[1;35m' ; CYA='\e[1;36m' NOR='\e[m'
# Bold+black background:
#RED_BL='\e[1;31;40m' ; GRE_BL='\e[1;32;40m' ; YEL_BL='\e[1;33;40m'
#BLU_BL='\e[1;34;40m' ; MAG_BL='\e[1;35;40m' ; CYA_BL='\e[1;36;40m'

LOGDIR=/var/log
TMPDIR=/var/tmp

SECUREDIR=${SECUREDIR:-/etc/securedir}          # securedir for Get_pass
AMTADMIN=${AM_USER:-admin}                      # AMT admin user
#AMTTIME=1                                      # Max. AMT całkowity czas
#AMTTIME=4                                      # volt
AMTTIME=9                                       # nas2 XXX :
# nas2% # arping s4
# ARPING 10.146.225.4
# Timeout
# 60 bytes from e8:40:f2:ec:58:37 (10.146.225.4): index=0 time=21.459 msec

export LAB_AMT='sd'                             # Brak AMT (ref: lab1)
export LAB_OFF="$HOME/.lab-off"                 # Lista wyłączonych maszyn (ref: lab1)

usage () { # full
  echo "użycie: $PROG -opcje host [cmd -opcje]  # Stan/sterowanie maszynami: włącz/wyłącz/zresetuj etc."
  if [ -n "$1" ]; then
    echo "\
-c : normalne kolory (bez tla)
-b : kolor czerwony mrugajacy
-d ; data na początku linii (format jak w logach)
-e : z etykietą
-k nazwa : dodaj komputer 'nazwa' do listy maszyn
-l : output in log format
-u user : konto na które logujemy sie do maszyn
host : maszyna | 'lista maszyn' | lab | all
cmd:                                                  cmd:
  -/+/= : usunięcie/dodanie/stan listy stacji. Plik: ~${LAB_OFF#$HOME}
  on|off|reset|cycle|wake|shut  : control               log                     : boot log
  ver sta cpu ram hd            : machine info          onhd|pingon|pingoff     : AMT setup
  boothd [n]                    : boot source = hdn     cmd localcommand [args] : run 'command host args
  boot [system] [wersja] [-t x] : pxe boot 'system'     ssh command [args]      : run command on guest system
  wait                          : wait for host         kto [-n]                : kto dzisiaj prowadzi zajecia"
  Lab_Off
  warn -R 'Brak AMT: ' "$LAB_AMT"
  echo "Znaczenie kolorów: \
${GRE}odpowiada$NOR ${BLU}wyłączony$NOR ${YEL}uśpiony$NOR włączony ${RED}brak-AMT$NOR ${CYA}null-ping$NOR ${MAG}unknown-ping$NOR"
  fi
}

. ZLIB

root () {                                       # root-test
  [ "$SUDO_USER" ] && return                    # optymailizacja (bez wolania id)
  [ $(id -un) = root ] || fatal "you must be root or have \$SECUREDIR/$PROG file with password"
}

List_del () { # list elems...                   # usuniecie elmentow elems z listy list
  local _n e _l _p _k                           # XXX: _n nie moze byc = _l (zmienna globalna)
  _n=$1 ; shift                                 # n=name, l=value
  eval _l=\$$_n
  _l=" $_l "                                    # otoczenie spacjami
  for e in $* ; do
    _p="${_l% $e *}"
    _k="${_l#* $e }"
    [ "$_p" != "$_l" ] && _l="$_p $_k"
  done
  _l=${_l## } ; _l=${_l%% }
  _l=${_l## } ; _l=${_l%% }
  eval $_n="'$_l'"
}

list_member () { # $listvar name                # Sprawdź czy name<m> jest elementem $var
  local l
  eval l=\$$1
  l=" $l "                                      # moze byc na pocz/koncu
  ! test "$l" = "${l#* $2 }" -a "$l" = "${l#* $2m }" # brak
}

in_list () { # list elem                        # Test if elem is on the $list
#set -x
  local l
  eval l=\$$1
  l=" $l "                                      # Otoczenie spacjami
  test "${l%%* $2 *}" = ""                      # Jest na liscie
#set +x
}

Get_pass () { # user                            # Fetch $user password
  local passfile=$SECUREDIR/$PROG               # Nie może być $PROG bo subproces
  [ -r $passfile ] || root
  pass=$($sudo grep "^$1" $passfile 2>/dev/null) # Nie może być $PROG bo subproces
  pass=${pass#* }                               # Skip user
}

Lock_echo () { # str                            # XXX zbędne ? Serializacja echo we FreeBSD
  LOCK=$TMPF-lock                               # Serialize screen output (mutex)
  trap 'rm $TMPF $LOCK 2> /dev/null' HUP INT QUIT TERM #EXIT # bez exit zostawi plik ?
  case "$UNAME" in
  FreeBSD) /usr/bin/lockf -t2 $LOCK echo -n $(echo "$*") ;; # 1s za mało
       #*) /usr/bin/dotlockfile -r2 -i1 $LOCK echo $* ;;
        *) echo "$*" ;;                         # Z pozostawieniem kursora na końcu
  esac
}

Lab_Off () { # [ +|- stacja... | = ]            # Dodanie/usunięcie stacji z listy. Stan listy.
  if [ -n "$1" ]; then
    op=$1 ; shift
    touch $LAB_OFF
    for s in $* ; do
      case "$op" in
      -|off) sed -i "s/\$/ $s /" $LAB_OFF ;;    # Dodanie maszyny do listy zablokowanych
      +|on)  sed -i "s/ $s //g"  $LAB_OFF ;;    # Usunięcie maszyny z listy zablokowanych
      esac
    done
  fi
  warn -B "Wyłączone:" "$(cat $LAB_OFF 2>/dev/null)"
}

DEBUG () { # '' | /dev/pts/<N> | run cmd | line #
  #global DTTY                                  # Terminal komunikatów
  #[ "$DEB" ] || return                         # XXX return wychodzi ze skryptu ?
  ttyauto () {                                  # automatycznie znajduje tty drugiej sesji
    DTTY=$(tty) ; DTTY=${DTTY#/dev/}
    DTTY=/dev/$(w | grep -w $USER | grep -v $DTTY | tail -1 | cut -w -f2)
  }
  case "$1" in
   '') ttyauto ;;                               # automatycznie druga sesja
   /*) DTTY=$1 ; clear > $DTTY ;;               # inicjalizacja
  run) shift ; $* > $DTTY ;;                    # polecenie
    *) echo "$*"  > $DTTY ;;                    # wydruk
  esac
}

Set_colors () { # [ATTR [BG [clist]]]           # Setup color $3. np. 5 40 RED
  # ESC[Attrib;Foreground;Background:
  # ATTR: NORM=0|'' BOLD=1 UNDERL=4 BLINK=5 REVERS=7
  # BG: BLACK=40 RED=41 GRE=42 YEL=43 BLU=44 MAG=45 CYA=46 WHITE=47
  local F B A color
  [ "$1" ] && A="$1;"                           #'1;'   bold
  [ "$2" ] && B=";$2"                           #';40'  black
  F=30          # = 1e  1f  20  21  22  23  24  25    # 4bit
  for color in ${3:-BLA RED GRE YEL BLU MAG CYA GRA} ; do
    #setvar $color "\\e[${A}${F}${B}m"          # Linux -
    eval $color="'\\e[${A}${F}${B}m'"           # przynajmniej jeden z A,F,B musi wystapic
    F=$((F+1))
  done
  NOR='\e[m'
}

save_cursor ()    { echo "\e7\c" ; }            # Save cursor position

restore_cursor () { echo "\e8\c" ; }            # Restore cursor position

goto_col () { $goto "\e[$1G" ; }                # Set cursor to column "n"

sort_line () { # n                              # Delete cursor pos. control-seq.
  local n=1
  [ "$logline" ] || return
  IFS=$(echo '\e[') set -- $(cat $logline)
  while [ "$1" ]; do
    printf '%i=%s (%x)' $n $1 $1
    shift
    n=$((n+1))
  done
}

vsortu () { # zmienna                           # Posortowanie listy w zmiennej + us. duplikatow
  eval l=\$$1
  l="$(echo -n $l | tr ' ' '\n' | sort -u | tr '\n' ' ')"
  eval $1="${l% }"
}

konsola () {                                    # Otworzenie konsoli IPMI/VNC
  [ "$DISPLAY" ] || { echo "brak zmiennej DISPLAY" ; exit 1 ;}
  echo TODO
  exit
}

Info () { # maszyna/lista                       # Informacje o maszynie
  nam="${1%m}"
  echo -n "$nam : "
# FC: QLE2460 1*4G PCIe 2.0 4x' ;;
  case "$nam" in
  mac) echo 'DH57JG CPU: i3-540 3GHz (4C,4T), RAM: 8G, no AMT, HD: 32G SSD SATA2 + 3x2T SATA3 ' ;;      # P: S5,min-max
   f0) echo '1U, SunFire X4100 M2, CPU: 2 x Opteron 2216 2.4GHz, RAM: 4G (4x1G brak 4 32G) HD: 2x146G SAS 10k 2.5"' ;;
f[12]) echo '2U, SunFire T2000, CPU: UltraSparc T1 (8C,32T), RAM: 32G, HD: 2x72G SAS 10K 2.5"' ;;
   f3) echo '2U, SunFire T2000, CPU: UltraSparc T1 (8C,32T), RAM:  8G (16x512), HD: 2x72G SAS 10K 2.5"' ;;
   f4) echo '4U, SunFire T445,  CPU: 2 x UltraSPARC III 1.6GHZ, RAM: 16G (4x2 DDR 333), HD: 6x72G SAS 10k, 2.5"' ;;
   f5) echo '2U, SunFire T240,  CPU: 2 x Sparc 1.4GHz, RAM: 2G (4*512), HD: 4x73G SCSI Ultra 10K 3.5"' ;;
  pe1) echo '1U, Dell PowerEdge 1950, CPU: 1 x Xeon 5160 3GHz (2C), RAM: 11GB (2x4+6x512), HD: 2x146GB SAS 10K 3.5", SATA 200G 2.5", PCIe: 2 wolne FH' ;;
  pe2) echo '2U, Dell PowerEdge 2950, CPU: 2 x Xeon 5160 3GHz (2C,2T,2M), RAM: 16G (8x2), HD: 6x146GB SAS 15K 3.5"' ;;
  ga*) echo '2U, CPU: 2 x Xeon 5130 2GHz (2C,2T,4M), RAM: 8G (4x1 R1 + 4x1 R2), HD: brak' ;;
  x32) echo '1U, IBM System X3250 M4, CPU: Pentium G620 2.60GHz (2C), RAM: 4G (1x4G brak 3 32G), SSD: ADATA-256G, HD: 1xSATA 500G, 1xSATA 250G, USB: Lexar 4G FreeNAS' ;;
var|x35) echo '1U, IBM System X3550 M2, CPU: 2x X5550 2.67GHz (4C,2T), RAM: 48G (12x4G brak 4), LSI: ServeRAID M5015 SAS/SATA Controller, HD: 2x146G SAS 10K 2.5" 2xSSD 256 2xwolne, FC: QLA2462 2*4G PCI-X' ;;
  x36) echo '1U, IBM System X3550, CPU: 2x Xeon X???? ?.67GHz (?C,?T), RAM: 8G (8x1G), HD: 2x250G SATA 7200K 3.5 Hitachi", FC: QLA2462 2*4G PCI-X' ;;
# SK101
 p101) echo 'Liksys 24p (old)' ;;
# SK102
 p102) echo "???" ;;
# SK103
p103[ab]) echo 'Cisco SG500X-48 48x1G + 2x10G' ;;
 k102) echo 'Dell OptiPlex 790, CPU: i5-2400 3.1GHz (4C,4T), RAM: 8G (4x2), HD: SSD 250G + HD 250G' ;; # SK102
 k[1-9]|k1[0-5]|k2[249]|k30)
       echo 'Dell OptiPlex 990, CPU: i5-2500 3.3GHz (4C,4T), RAM: 8G (2), HD: 250G SATA' ;;
   k*) echo 'Dell OptiPlex 990, CPU: i5-2400 3.1GHz (4C,4T), RAM: 16G (2), HD: SSD 500G' ;; # SK102 ?
# GE113
p113a) echo 'Cisco SG300-52 50x1G + 2x1G' ;;
p113[bc]) echo 'Cisco SG300-52 50x1G + 2x1G' ;;
  l33) echo 'Dell OptiPlex 790, CPU: i5-2400 3.1GHz, RAM: 8G, HD: SSD Adata 250G + SATA (GE227), FC: QLE2460, ServiceTag: HFM485J F2:Bios F12:Menu' ;;
 l33n) echo 'Dell OptiPlex 9020, CPU: i5-4590 3.3GHz (4C,0T), RAM: 16G, HD: SSD 500G + SATA (GE227), FC: QLE2460, ServiceTag: HFM485J F2:Bios F12:Menu' ;;
   l*) echo 'Dell OptiPlex 990, CPU: i5-? 3.?GHz, RAM: 8G,  HD: 250G SATA' ;;
# GE213
  vol) echo 'Tyan K8QS (S4882) 2U, CPU: 4*Opteron 880 2.4GHz (2C,2T), RAM: 32G (16*2G), HD: SATA SSD 60G, SCSI 73G, SCSI 146G' ;;
  wat) echo 'Tyan K8QS (S4882) 2U, CPU: 4*Opteron 880 2.4GHz (2C,2T), RAM: 24G (16*2G), HD: SCSI 73G, SCSI 146G' ;;
 p213) echo 'HP 5412zl (J8698A) Switch, revision K.15.14.0007, ROM K.15.30, (ProCurve)' ;;
p213a) echo 'Netgear GS748Tv3 48x1G V3.1.4 (rak 1)' ;;
p213b) echo 'Linksys SRW2048EU 48x1G with WebView (rak 1)' ;;
p213c) echo 'Cisco SG300-28 26x1G + 2x1G (rak klaster)' ;;
# GE225
p225[ab]) echo 'Cisco SG300-28 26x1G + 2x1G' ;;
 p225) echo 'Cisco SG300-52 50x1G + 2x1G' ;;            # byl w SK103
  so*) echo 'PC , CPU: E6500 2.9GHz (4C,4T), RAM: 4G, HD: 160G SATA' ;; # XXX coto ??
  p13) echo 'GSM7224 L2 Managed Gigabit Switch' ;;
 p13b) echo 'HP J4902A ProCurve Switch 6108, revision H.07.90, ROM H.07.01 (/sw/code/build/fish(ff03))' ;;
 p225s[789]) echo 'Netgear GS108Tv2 8x1G' ;;
   m1) echo 'Dell T5400, CPU: 2x Xeon 3.5G, RAM: 16G, SSD: 250G HD: 250G SATA, NET: 1G + 10G BCM5754+BCM5721' ;;
   m2) echo 'Dell 490, CPU: 2x Xeon E5345 2.33GHz (4C,4T), RAM:  8G, SSD: 250G HD: 250G SATA' ;;
   s0) echo 'Dell OptiPlex 990 Tower, CPU: i5-2400 3.1GHz (4C,4T), RAM: 16G (4x4), HD: SSD 256 + SATA 2.5"500G SATA, Monitor: 1280x1024' ;;     # k33
s[1-4]) echo 'Intel DQ77KB, CPU: i7-3770S 3.1GHz (4C,8T), RAM: 8G, HD: brak, Monitor: 1280x1024' ;;
   sa) echo 'Intel DQ77KB, CPU: i5-3570K 3.4GHz (4C,4T), RAM: 8G, HD: brak, P: 2,30-72W, CPU -> OLD BIOS -> no AMT' ;; # P: S5,min-max
   sb) echo 'Intel DQ67EP, CPU: i7-2600K 3.4GHz (4C,8T), RAM: 8G, HD: brak' ;;                  # zasilacz wielki
   sc) echo 'Intel DQ67EP, CPU: i7-2600K 3.4GHz (4C,8T), RAM: 8G, HD: brak, P: 3,22-120?' ;;            # Zas.19V + mini-ITX sam.
   sd) echo 'Dell OptiPlex 990, i5-2400  3.1GHz (4C,4T), RAM: 16G (2), HD: SSD 240G (W11)' ;; # mik GE227 -> GE221
   se) echo 'PC P5E-VM HDMI, CPU: Core2 Duo E8400 3GHz (2C,2T), RAM: 4G (4x1G DDR-400), HD: brak' ;;
   sx) echo 'mini PC ASUS Q87T, CPU: i7-4790K 4GHz (4C,8T), RAM: 16G, P: 1,3,22-140' ;; # zasilacz 19V
   sy) echo 'mini PC ASUS Q87T, CPU: i7-4790K 4GHz (4C,8T), RAM: 16G, P: 1,3,22-140' ;; # zasilacz 19V
   sf) echo 'Intel DQ77KB, CPU: i7-3770S 3.1GHz (4C,8T), RAM: 8G (1x8G) - uszk. gniazdo CPU, HD: brak' ;;       # Uszk. gniazdo CPU!
   s*) echo 'Intel DQ77KB, CPU: i7-3770S 3.1GHz (4C,8T), RAM: 8G, HD: brak, Monitor: 1440x900, P:3,22-120' ;;
   t0) echo 'PC w raku, CPU: ? , RAM: 1G, HD: SATA2 200G WD10JPVT-00A1YT0' ;;
   t8) echo 'Soekris net5501-70, CPU: AMD Geode 500MHz, RAM: 512M, HD: SATA2 200G WD10JPVT-00A1YT0, CF: 8G Lexar' ;;
   t9) echo 'Soekris net5501-70, CPU: AMD Geode 500MHz, RAM: 512M, HD: CF 8G Lexar' ;;
   ta) echo 'Soekris net5501-70, CPU: AMD Geode 500MHz, RAM: 512M, HD: CF 8G Lexar' ;;
   tb) echo 'Soekris net4826, CPU: AMD Geode 300MHz, RAM: 512M, HD: CF 8G Lexar' ;;
   tc) echo 'Soekris net4801, CPU: AMD Geode 200MHz, RAM: 512M, HD: CF 8G Lexar' ;;
   t*) echo 'mini PC VIA EPIA, CPU: EPIA 1GHz, RAM: 512M, HD: brak' ;;
# GE226
 p226[ab]) echo 'Cisco SG300-52 50x1G+2x1G' ;;
# GE227
   d33) echo 'Dell 490, CPU: 2x Xeon E5345 2.33GHz (4C,4T), RAM: 16G, HD: 2*75G+150G SATA, FC: ISP2312 2x2G, NS PCI-6221' ;;
  rpi3) echo 'Raspberry Pi 3B+ LPDDR2 1G 4x1.4Ghz ARM Cortex-A53 BCM2837B0  2018' ;;
  rpi4) echo 'Raspberry Pi 4B  LPDDR4 4G 4x1.5Ghz ARM Cortex-A72 BCM2711    2019' ;;
# GE508
   me[568]|m14|m23|m30) echo 'Dell OptiPlex 790, CPU: i5-2400 3.1GHz (4C,4T), RAM: 8G (4), HD: 250G SATA' ;;
   me*) echo 'Dell OptiPlex 790, CPU: i5-2400 3.1GHz (4C,4T), RAM: 8G (2), HD: 250G SATA' ;;
p508[ab]) echo 'Cisco SG300-52 50x1G+2x1G' ;;
# GE510
   d8) echo 'Dell 490 CPU: 2x Xeon E5345 2.33GHz (4C,4T), RAM: 8G, HD: 240G SATA, BCM5752 - rzutnik' ;;
  d19) echo 'Dell 490 CPU: 2x Xeon E5345 2.33GHz (4C,4T), RAM: 4G, HD: 240G SATA, BCM5752 <- RAM!' ;;
  d23) echo 'Dell 490 CPU: 2x Xeon E5345 2.33GHz (4C,4T), RAM: 6G, HD: 240G SATA, BCM5752 <- RAM!' ;;
  d27) echo 'Dell 490 CPU: 2x Xeon E5320 1.86GHz (4C,4T), RAM: 8G, HD: 240G SATA, BCM5752 <- bateria!' ;;
  d[28]|d1[3579]|d2[23])echo 'Dell 490 CPU: 2x Xeon E5345 2.33GHz (4C,4T), RAM: 8G, HD: 240G SATA, BCM5752' ;;
  d30) echo 'Dell 490 CPU: 2x Xeon E5345 2.33GHz (4C,4T), RAM: 12G, HD: 240G SATA, BCM5752 + BCM5721' ;;
   d*) echo 'Dell 490 CPU: 2x Xeon E5320 1.86GHz (4C,4T), RAM: 8G, HD: 240G SATA, BCM5752' ;;
#
  lo*) echo 'PC , CPU: Core2-4300 1.8GHz, RAM: 4G, HD: 76G SATA' ;;
   e0) echo '4U, Tyan S7012, CPU: 2xE5520 2.27GHz(4C,8T), RAM: 72G(96G), LSI:MegaRAID SAS 2108[Liberator](rev 05), HD: 1*8G SATA-CF, 4*1T SATA, 3*2T SAS (r5:3.64T), 1*140G SAS 15k, FC: 2*4G ISP2432, Del/F4:BIOS F11:MENU F12:PXE' ;;
       #BIOS: Setup:Del/F4  Boot Menu:F11  PXE:F12
e[1234]) echo 'Dell T5400, CPU: 2 x Xeon 3.5G, RAM: 16G, HD: 250G+250G SATA, NET: BCM5754+BCM5721+MT27710_2x25G, FC: ISP2312 1x2G' ;; # HITACHI 250G, Seagate ST3400620AS
   e5) echo '2U, SuperMicro X10DRC, CPU: 2xE5-2680v3 2.5GHz(12C,24T), RAM: DDR4 128G (8*16), LSI:MegaRAID SAS-3 3108[Invader](rev 02), HD: 13*256G SATA SSD ADATA SU900 + 11*600G SAS 10K, FC: QLE2462 2*4Gb' ;;
  amp) echo '"P5E WS Pro, CPU: Q6600  2.4G (4C,0T), RAM: 8 (4*2,1600MHz), HD: 2*72G SAS, 3*750G SATA, 3*1T SATA' ;;
 nas1) echo 'SuperMicro X11SRM-VF, CPU: Xeon W-2125 4.5GHz (4C8T, L1/2/3:32K/256K/12M, 120W), RAM: DDR4 128G (4*32,1600MHz), HD:, 2*10T SATA, FC: 2*4G ISP2432' ;;
#root@nas1[~]# nvmecontrol devlist
# nvme0: INTEL MEMPEK1W032GA     nvme0ns1 (27905MB)
# nvme1: INTEL SSDPE21D480GA     nvme1ns1 (457862MB)
# nvme2: INTEL SSDPE21D480GA     nvme2ns1 (457862MB)
# nvme3: Samsung SSD 970 EVO 2TB nvme3ns1 (1907729MB)
#root@nas1[~]# camcontrol devlist
#<HGST HUH721010ALN600 LHGNT384>    at scbus1 target 0 lun 0 (pass0,ada0)
#<HGST HUH721010ALN600 LHGNT384>    at scbus4 target 0 lun 0 (pass1,ada1)
#<HGST HUH721010ALN600 LHGNT384>    at scbus6 target 0 lun 0 (pass2,ada2)
#<HGST HUH721010ALN600 LHGNT384>    at scbus7 target 0 lun 0 (pass3,ada3)

 nas2) echo 'SuperMicro X9SRH-7TF, CPU: Xeon E5-1650v2 1.2-3.5GHz (6C,12T, L1/2/3:32K/256K/12M, 130W), RAM: 32G (4*8,1600MHz), LSI: SAS2308 Fusion-MPT SAS-2 (rev 05), HD: 256G SATA SSD, 8*2T SATA, FC: 2*4G ISP2432' ;;
   ex) echo 'PC, ASUS P9X79 WS, CPU: i7-3820 3.6GHz (4C,8T), RAM: 64G (8*8) DDR3, HD: 0, FC: ISP2432 2*4G' ;;
   e*) echo 'Dell T5400, CPU: 2 x Xeon 3.5G, RAM: 16G,  HD: ' ;;
# GE227
 p227) echo 'Netgear GS108Tv2 8x1G (ato)' ;;
p227r) echo 'HP J4813A ProCurve Switch 2524 24x100M+2x1G' ;;
p227r2) echo 'Netgear GS108Tv2 8x1G (rak)' ;;
# GE510
p510[ab]) echo 'Cisco SG300-52 50x1G+2x1G' ;;
#JS
   j0) echo 'HP ProLiant iCPU: Xeon 2GHz (4C4T) 8MB, RAM: 32G (8x4G 667MHz), ZAS: 1x 226W, NET: iLO+2x1G iSCSI' ;;
   j[12]) echo 'Supermicro 2x2CPU' ;;
    *) echo TODO ;;
  esac
}

Set_lists () {                                  # Ustaw listy stacji
  alist="ap103 ap225 ap277 ap510"               # Punkty dostępowe WiFi
  klist=$(seq -s' ' -f k%g 31)                  # SK103 k1-k31
  List_del klist k17 #k18 ; klist="$klist k32"  # XXX k32 w miejscu k18, k17 - do ustawienia - haslo ?
  llist=$(seq -s' ' -f l%g 30)                  # GE113 l1-l30

  slist="$(seq -s' ' -f s%g 0 9) sa sb sc sd sf" # GE225 s0-s7 stacje, sa po wymianie CPU+BIOS
  Slist="$(seq -s' ' -f s%g 0 9) sa sb sc sd se" # GE225 s0-s14 stacje
  tlist="$(seq -s' ' -f t%g 0 6) t8 t9 ta tb tc" # GE225 trasowniki
  malist="ma mb"                                # GE225 maki
  list225="$slist $mlist $tlist"                # GE225 wszystkie

  #mlist=$(seq -s' ' -f m%g 1 37)               # GE508  m1-m37
  mlist="m1 m2"                                 # GE225  m1 m2
  dlista=$(seq -s' ' -f d%g 22)                 # GE510a d1-22
  dlistb=$(seq -s' ' -f d%g 23 30)              # GE510b d23-30
  dlist="$dlista $dlistb"                       # GE510  d1-d30
  elist="e0 e1 e2 e3 e4 e5 ex ampn"             # ESX-y
  elist="e0 e1 e2 e3 e4"                        # ESX-y
  clist="c0 c1 c2 c3 c4 c5 c6 c7 c8"            # cuda : c7 c8
  clist="c8 c7"                                 # XXX
  jlist="j0 j1 j2"                              # js
  flist="pe1 pe2m f4 f0 f1 f2 f3  f5"           # f0m-f5m pe1 pe2
 pelist="pe1 pe2"                               # pe1 pe2
  rlist="rpi3 rpi4"                             # rpi3 rpi4
  xlist="x32 x35 x36"                           #
  zlist="ato erg"                               # GE227
  # Przelaczniki:
  #p13="p13 p13b"                               # SK13
  p101="p101"                                   # SK101
  p102="p102"                                   # SK102
  p103="p103a p103b"                            # SK103
  p113="p113a p113b p113c"                      # GE113
  p213="p213 p213a p213b p213c"                 # p213 ?
  p225="p225a p225b"                            # GE225
  p225_="p225s7 p225s8 p225s9 p225sb"           # GE225 TODO PB: p225sb (websmart)
  p226="p226a p226b"                            # GE226
  p227="p227 p227r p227r2"                      # GE227
  p508="p508a"                                  # GE508
  p510="p510a p510b"                            # GE510
  plist="$p101 $p102 $p103 $p113 $p213 $p225 $p225_ $p226 $p227 $p508 $p510" # przelaczniki
  #
  LIST_ALL="$klist $slist $llist $mlist $dlist $elist $clist $jlist $flist $xlist $plist"
  #
  amt508="m2 m3 m5 m6 m8 m13 m14 m16 m20 m21 m23 m25 m29 m30 m31 m32 m33 m35 m36"
  AMT_LIST="$slist $llist$klist $amt508"        # Maszyny z AMT
  List_del AMT_LIST sd k17                      # XXX s? czasowo - CPU!
  IPMI_LIST="$e0 e5 $clist pe1 pe2"             # Maszyny z IPMI
  ALOM_LIST="f0 f1 f2 f3 f5"                    # Maszyny z ALOM
  nlist="nas2 nas nas0 nas10 mac"               # Maszyny z FreeNAS: old current next alpha
}

Blink_field () { # k text                       # Mrugający text w kol. k
  BLNK='\e[5m'                                  # Rewers
  #echo $BLNK$BOLD$red"xxxxxx mruganie+rozjasnienie xxxxxxxx"$NOR
  local host=$(goto_col $2)$1
  host=$(echo $BLNK$RED$host$NOR)
  echo "${host%m}"
}

Host_color () { # host                          # Get host status
  local host=$1
  LAB_off=$(cat $LAB_OFF 2>/dev/null)
  if in_list LAB_off $host ; then               # Aktualnie nieczynne/uszkodzone
    color="$RED"
  elif in_list LAB_AMT $host ; then             # Aktualnie bez AMT
    color="$RED"
  elif in_list AMT_LIST $host ; then            # AMT managed host ?
    color=$(amt_status $host)
  elif in_list IPMI_LIST $host ; then           # IPMI
    color=$(ipmi $host color)
  elif in_list ALOM_LIST $host ; then           # ALOM
    color=$(alom-ipmi -c $host)
  else
    color="$RED"                                # Brak AMT
    :
  fi
}

# Ustawia kursor na pierwszej oczekujacej nie wypełnionej pozycji
goto_wait () {                                  # Set cursor to waiting place
  local k p pid i BLINK                         #
  #BLINK='\e[5m'# TODO to nie jest BLINK        # Ustawienie atrybutu BLINK(5) na polu
  #DEBUG #/dev/pts/3
  #DEBUG "plist: '$PLIST'" #; DEBUG run pst -p $$
  i=0
  while [ -n "$PLIST" ] ; do
    p=${PLIST%% *}
    pid=${p%:*}
    if pgrep -P $pid >/dev/null 2>&1 ; then
      k=${p#*:}
      echo "$(goto_col $k)$BLINK\c"             # XXX /usr/bin/lockf ?
      #wait $pid
      sleep 0.5
      i=$((i+1)) ; [ $i -gt 100 ] && break      # Na wypdek trwałych procesów
    else
      List_del PLIST $p                         # Usuń element z listy
    fi
  done
}

Get_AMT () { # url # $host $k                   # Fetch AMT url
  # TODO dlaczego ARP dla wyłączonych tak długo trwa ? (dziennik w =ip-n-225)
  # TODO dla długiego czasu oczekiwania od razu wyswietlić, potem zmienić. Można tez tylko ustawić kursor
  Get_pass $AMTADMIN                            # TODO bez hasła w linii
  #sSL = --silent --show-error --location #--verbose
  #opt="-sSL --retry-connrefused --retry 9 --retry-delay 1 --retry-all-errors" # --fail"
  opt="--retry 5 --retry-delay 1 --retry-all-errors --retry-connrefused" # =5 : err
  curl -sfkL --retry 5 --retry-delay 1 --retry-all-errors --retry-connrefused --anyauth -u admin:bR61<@hj http://index.htm:16992/all
  curl="curl -sfkL $opt --anyauth -u $AMTADMIN:$pass http://$host:16992/$1"
  $curl
  exit=$?
  if [ $exit -ne 0 ]; then
     fatal "$(goto_col $k)$host" " exit code $exit : $(curl-exit $exit)\n$curl"
     case "$exit" in
      3) m="URL malformed. The syntax was not correct" ;;
      7) m="Failed to connect to host" ;;
     22) m="The requested url was not found or returned HTTP error code 400 or above" ;;
     esac
     if [ "$UNAME" = "Linux" ]; then
       #sudo arping -q -c1 -W1 -w8 $host >/dev/null     # XXX ?
       #rmcpping -c1 -t1 $host >/dev/null       #
       #curl -sfI "http://$host:16992/index.htm" >/dev/null
       sleep 1
     else
       sleep 3
     fi
  fi
  # Czasy:
  #eval $(pas amt=) ; curl-time -sfkL --max-time 9 --anyauth -u $AMT http://$s:16992/index.htm
}

info_ver () { # host                            # AMT version
  host=$1
  resp=$(Get_AMT index.htm   | sed -n '/version:/s/.*: //;s/ &.*//p')
  warn -G "$host" " $resp"
}

info_hd () { # host                             # HD info TODO więcej
  host=$1
  resp=$(Get_AMT hw-disk.htm | sed -n '/ MB/s/.*r1>//;s/<.*//p' | tr '\n' ' ')
  warn -G "$host" " $resp"
}

info_ram () { # host                            # RAM info TODO więcej
  host=$1
  resp=$(Get_AMT hw-mem.htm  | sed -n '/ MB/s/.*r1>//;s/<.*//p' | tr '\n' ' ')
  warn -G "$host" " $resp"
}

info_cpu () { # host                            # CPU info TODO więcej
  host=$1
  resp=$(Get_AMT hw-proc.htm | sed -n '/CPU @/s/<[^>]*>//gp')
  warn -G "$host" " $resp"
}

amt_status () { # host                          # AMT status
  host=$1
  resp=$(Get_AMT index.htm | grep -A1 'Power' | sed -n '$s/<[^>]*>//gp' | cut -f 2)
  case "$resp" in
       *On) color='' ;;                         # AMT 7.1.52 (k9) daje '  Off'
      *Off) color="$BLU" ;;                     #
  *Standby) color="$YEL" ;;                     #
        '') color="$RED" ;;                     # No AMT response
         *) color="$host $resp" ;;              # Unknown AMT response
  #Blink_field $2 $1
  esac
  echo $color
}

win_shutdown_rpc () { # host                    # Shutdown a Windows. Requires samba-common package installed
  host=$1                                       # XXX IP ?
  user_pass="$admin%$pass"                      # administrator on the Windows machine.
  net rpc shutdown -I $host -U "$user_pass"     # samba
  #net rpc                                      # Show all relevant commands
  #net rpc shutdown -r                          # Reboot the Windows machine
  #net rpc abortshutdown                        # abort shutdown of the Windows machine
}

win_shutdown_ssh () { # host                    # Shutdown a Windows. Requires sshd package installed
  host=$1
  ssh $admin@$host sudo Stop-Computer
}

Sudo_optim () { # list...                       # Optymalizacja aby nie wołać n-razy sudo
  local passfile=$SECUREDIR/lab                 # nie może być $PROG bo subproces
  [ -r $passfile ] && return
  [ "$SUDO_USER" ] && return                    # Optymalizacja (bez wołania id)
  if [ $# -ge 1 ]; then                         # TODO było 2 ale lab s1 wymaga root-a
    [ $(id -un) = root ] || exec sudo $0 $ARGS
  else
    [ $(id -un) = root ] || sudo=sudo
  fi
}

Set_goto () { # n                               # Ustawienie $goto w zal. czy n > szer. okna
  if [ -t 2 ]; then                             # Okno terminala nie za wąskie ? (30:111)
    F=-F ; [ "$UNAME" = "FreeBSD" ] && F=-f
    MAXLINE=$(stty $F /dev/stderr size)         # echo x | lab s1 cat
    MAXLINE=${MAXLINE##* }                      # 56 104 min=110
  else
    MAXLINE=300                                 # Globalna - użyta później
  fi
  if [ $1 -ge $MAXLINE ]; then
    goto=:                                      # Okno za wąskie - deaktywacja kursora, nieposortowane :(
  else
    goto=echo                                   # OK - będziemy używali pozycjonowania kursora ANSI
  fi
}

dns_host () { # host                            # Test czy $host jest w DNS
  host $1 > /dev/null && return
  fatal "brak mapowania DNS maszyny:" " $1"
}

amt_host () { # host                            # Test czy $host ma AMT
  dns_host $1
  in_list AMT_LIST $1 && return
  fatal "brak AMT na maszynie:" "$1"
}

host2lab () { # host                            # Znalezienie lab w którym jest host
  case "$1" in
     mm[ab]) lab=225 ;;                         # Macmini
  t[0-9abc]) lab=225 ;;                         # Trasowniki
s[0-9abcde]) lab=225 ;;                         # Komputery
    l[0-9]*) lab=113 ;;                         # GE113
    k[0-9]*) lab=103 ;;                         # SK103
    m[0-9]*) lab=508 ;;                         # GE508
    d[0-9]*) lab=510 ;;                         # GE510
  vol*|amp*|wat|var|ohm|mho|e[0-5]) lab=serwerownia ;;
          *) fatal "brak definicji lab dla maszyny:" " $1" ;;
  esac
}

Host_wait () { # host                           # Czekaj aż maszyna $1 wstanie
  host=$1
  dns_host $host
  #amt_host $host
  #root
  # TODO s1 ..... s2 ....... s3
  for i in $(seq 20) ; do                       # Max. 40s (80zn)
    Hoststatus $host && break
    sleep 2
  done
  sleep 5                                       # Tyle jeszcze wymaga FreeBSD aby móc się logować
  echo
}

Guess_OS_p0f () { # host                        # Detekcja systemu operacyjnego
  host=$1
  dns_host $host
  ping_test $host || return 1
  echo "detectig OS of $host ...(30s)"
  TODO
  dev=
  sudo p0f -i $dev
}

Guess_OS () { # host                            # Znalezienie systemu operacyjnego maszyny
  host=$1
  dns_host $host
  ping_test $host || return 1
  echo "detectig OS of $host ...(30s)"
  sudo nmap -O --max-os-tries 1 --osscan-limit --osscan-guess $host | # TODO za długo trwa
    sed -n '/OS guesses:/s/.*: //p'
  # OS details: Microsoft Windows Vista SP0 or SP1,
  # Windows Server 2008 SP1, or Windows 7, Microsoft Windows Vista SP2 or Windows Server 2008
}

ping_test () { # $host                          # Test czy odpowiada na ping
  # rmcpping ?                                  # w freeipmi-tools
  # rmcp_ping                                   # w openipmi TODO nie działa
  host=$1
  case $UNAME in
    Linux) ping=ping ; W=-W1 ;;                 # W=wait
  FreeBSD) i=.1                                 # XXX Zmodyfikowany ping. Inaczej i=1 lub sudo
           ping="$sudo /sbin/ping" ; W="-i$i -W100" ;;
  esac
  $ping -q -c1 $W $host 1>/dev/null 2>&1        # Bez komunikatów
}

ping_rmcp () {
  TODO
   # https://software.intel.com/sites/manageability/AMT_Implementation_and_Reference_Guide/default.htm?turl=WordDocuments%2Fusermcppingtodeterminetheplatformstate.htm
}

ping_test_OLD () { # host                       # Ustaw $color dla host
  #root : Szybszy (.1<1) ale wymaga UID=0 : ping: -i interval too short: Operation not permitted
  #i=1 ; [ "$SUDO_USER" ] && i=.1
  resp=$($ping -q -c1 $wait $host 2> /dev/null | /usr/bin/fgrep packet)
  case "$resp" in
  *'100.0% packet loss') Host_color $host ;;    # Nie odpowiada - 100% strat - AMT ?
     *'0% packet loss'*) color=$GRE ; ex=0 ;;   # OK - odpowiada na ping-a
         #'round-trip'*) color=$GRE ; ex=0 ;;   # OK - odpowiada na ping-a
  '')            color=$CYA ; ex=1 ;;           # Null ping output ??
   *)            color=$MAG ; ex=2 ;;           # Unknown ping output ??
  esac
}

Host_status () { # host                         # Ustaw $color dla host
  host=$1
  ping_test $host
  case "$?" in
  0) color=$GRE ; ex=0 ;;                       # Odpowiada
  *) Host_color $host ;;                        # Nie odpowiada - 100% strat - AMT ?
  esac
}

Hoststatus () { # [-k n] host                   # Print host status (in color) in column n (ping-based)
  local k color B=
  local ex=3                                    # Kod powrotu

  case "$1" in
  -k) k=$2   ; host=$3 ;;
   *) goto=: ; host=$1 ;;
  esac

  Host_status $host                             # Ustaw color

  name=${host%m}                                # Wyświetlamy bez m jeśli jest
  [ "$color" ] && name="$color$name$NOR"

  if [ "$logline" ]; then
    echo "$k:$name" >> $logline         # XXX Lock_echo ?
  else
    case "$goto" in
    :) B=' ' ;;
    *) name=$(goto_col $k)$name ;;              # Random & sorted
    esac
    #Lock_echo "$name$B\c"                      # Serializacja dostępu do ekranu XXX zbędna?
    echo "$name$B\c"
  fi
  return $ex
}

# START

PROG=${0##*/}
ARGS="$@"                                       # Sudo_optim

echo "$(date +%T) : lab $*" >> /tmp/lab1.log    # XXX czasowo

bin=${0%/bin/*}/bin                             # /usr/local/zetis/bin

if false ; then # -opcje z końca na początek
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
fi

TMPF=$TMPDIR/$PROG-$$

. /usr/local/zetis/lib/sh                       # Read library (loguj, $DEB)

$bin/dysk-free $TMPDIR 1 || exit 3              # Na dysku musi być wolne miejsce

Set_colors 1 #40                                # Kolory 1:BOLD on 40:BLACK lepiej widać

Set_lists                                       # Grupy

[ '' = "$(echo -e)" ] && alias echo='echo -e'   # Potrzebne -e w Arch

f=
while getopts cBdelk:u:rbfxh opt ; do           # $OPTARG
  case "$opt" in
  c) Set_colors ;;                              # Normalne kolory (bez tła)
  B) Set_colors 5 40 RED ;; #RED='\e[5;31m' ;;  # Set blinking red
  d) DAT=$(date '+%d %H:%M') ; OFFSET=${#dat}  ; echo -n "$DAT  " ;;
  e) label=YES ;;
  l) logline=$TMPF ; touch $logline || fatal "nie moge utworzyć pliku:" " $logline" ;;
  k) k_list="$k_list $OPTARG" ;;                # Dodatkowe pc (np. laptopy)
  u) user="-l $OPTARG" ;;                       #
  r) cmd=reset ;;
  b) cmd=boot ;;
  f) fopt=yes ;;
  x) set -x ; export x=-x ;;
  ?) usage full ;;
  esac
done
shift $((OPTIND-1))

export UNAME=$(uname)                           # Linux/FreeBSD

lab1=lab1                                       # Program używany dla jednej maszyny
lab=
case "$1" in
   '') exec lab225              ;;              # Info - status
+|-|=) Lab_Off $* ; exit        ;;              # Dodanie/usunięcie stacji z listy
    h) usage                    ;;
# Grupy:
    a) list=$alist              ;;              # Punkty dostępowe WiFi
    k) list=$klist              ;;              # Komputery
    t) list=$tlist              ;;              # Trasowniki
    m) list=$mlist              ;;              # m1-m37 (GE508)
   mm) list=$malist             ;;              # Maki
    r) list=$rlist              ;;              # Raspberry Pi
    s) list=$slist ; LAN=adm    ;;              # s1-s8
    S) list=$Slist ; LAN=adm    ;;              # s1-s15
    l) list=$llist              ;;              # l1-l30
    d) list=$dlist              ;;              # d1-d30
    e) list=$elist              ;;              # e1-e4
e[05]) list=$1     ; lab1=ipmi  ;;              # e0,e5
    j) list=$jlist ; lab1=ipmi  ;;              # j1 j2
    f) list=$flist ; lab1=alom  ;;              # f0, f1-f3, f4, f5
    c) list=$clist ; lab1=ipmi  ;;              # c1-c8
    p) list=$plist ; lab1=sw    ;;              # Przełączniki
   pe) list=$pelist; lab1=ipmi  ;;              # Serwery Dell pe1 pe2
 p103) list=$p103  ; lab1=sw    ;;              # Przełączniki w SK103
 p113) list=$p113  ; lab1=sw    ;;              # Przełączniki w GE113
 p225) list=$p225  ; lab1=sw    ;;              # Przełączniki w GE225
 p226) list=$p226  ; lab1=sw    ;;              # Przełączniki w GE226
 p227) list=$p227  ; lab1=sw    ;;              # Przełączniki w GE227
 p510) list=$p510  ; lab1=sw    ;;              # Przełączniki w GE510
# Pomieszczenia:
#    1) ;&
#  sk*) ;&
  10*) lab=103     ; list=$klist  ;;            # k1-31

  22*) lab=225     ; list="s0 t0 s1 t1 s2 t2 s3 t3 s4 t4 s5 t5 s6 t6 s7 s8 s9 t9 sa ta ma sb tb mb sc tc sd se";; # po kolei
   2*) lab=225     ; list="$slist $mlist $tlist" ;; # grupami

   5a) lab=510a    ; list=$dlista ;;            # d1-22
   5b) lab=510b    ; list=$dlistb ;;            # d23-30
  50*) lab=508     ; list=$mlist  ;;            # m1-m37
   5*) lab=510     ; list=$dlist  ;;            # d1-30

  11*) lab=113     ; list=$llist  ;;            # l1-30

    f) lab=213     ; list=$flist  ;;            # f0m-f5m pe1m pe2m

    x) lab=227     ; list=$xlist  ;;            # x32 x35 x35m

    n) lab=213     ; list=$nlist  ;;            # nas-y

    z) list=$zlist              ;;              # Moje arg ato
#
  kto) exec lab-kto $* ;;
  all) shift ; $0 103 "$@" ; $0 225 "$@" ; $0 510 "$@" ; $0 113 "$@" ; exit ;;
# Lista explicite
    *)               list=$1 ; logline= ;;      # l5 lub 's1 s2'
esac
shift

# Lista maszyn:

arg1= ; [ $# -eq 1 ] && arg1=$1                 # Tylko jedna stacja ?

while [ "$1" ]; do
  list_member LIST_ALL $1 || break              # Koniec listy maszyn
  list="$list $1"
  shift
done

# Usunięcie wyłączonych:

LAB_off="$(cat $LAB_OFF 2>/dev/null)"           # Wyłączone maszyny. Export do lab1 ?
for x in $LAB_off ; do
  [ "$arg1" = "$x" ] && continue                # Gdy tylko jedna maszyna nie patrzymy na $LAB_OFF
  [ "$fopt" ] || List_del list $x               # Usuń element z listy
done

[ "$1" ] && { cmd=$1 ; shift ;}

Sudo_optim $list                                # Liczebność $list

Set_goto ${#list}                               # Długość łańcucha $list

case "$cmd" in
 +|-|=) Lab_Off $cmd $list ; exit       ;;      # Dodanie/usunięcie stacji z listy
     l) echo $list $k_list; exit ;;
   inf) prog=Info ;;
    '') prog='Hoststatus -k $k' ; BG='&' ;;     # amt1
    ve) prog=info_ver ;;
    hd) prog=info_hd  ;;
   ram) prog=info_ram ;;
   cpu) prog=info_cpu ;;
  ping) prog=pingtest ;;
   cmd) prog="$@" ;;
   Log) [ "$lab" ] || host2lab $list ; exec tail -20 $LOGDIR/lab-$lab ;;
   log) prog=boot  BG="log $@" ;;
syslog) logline=$TMPF ; touch $logline || fatal "nie mogę utworzyć:" " $logline" ;;
  wait) Host_wait $list ; exit ;;               # Czekaj aż maszyna wstanie
    os) Guess_OS $list ; exit ;;
   kto) exec lab-kto $lab  ;;
reboot) prog='ssh $ssh_opt $user' ; BG="$@" ; popt='sudo reboot' ;;
  boot) prog=boot ; BG="$@" ;; # label=yes ;;   # BG a nie popt aby nie bylo z &
amt|on|off|reset|cycle|sleep|suspend|wake|shut|boothd|bootpxe|sta|ver|ifs|kons|usr|aping|pingoff|pingon)
        prog=${0}1  BG="$cmd $@" ;;             # prog=lab1
   ssh) prog='ssh $ssh_opt $user' ; BG="$@"     # BG a nie popt aby nie bylo z &
        label=ssh ;;
     *) prog=$(which ${cmd%% *})                # TODO aliasy np. h ale tylko z ~/.zshenv
        #prog=$(command -v $prog)               #
        prog=${prog##*/}                        # Lokalny program
        LIST=' who finger users ip ifconfig systemctl ' # lub brakujący lokalnie ale dostępny zdalnie
        [ "$prog" ] || [ "${LIST#* $cmd }" != "$LIST" ] && popt=$cmd
        prog='ssh $ssh_opt $user' ; BG="$@"
        label=yes ;;
esac

#[ "$logline" ] && Set_colors 1 40              # logi - BOLD on BLACK

ssh_opt="-o ConnectTimeout=1"                   # 1s (LAN)
[ -z "$DSPLAY" ] && ssh_opt="-o ForwardX11=no $ssh_opt"

t0=$(date +%s)

k=${OFFSET:-1}                                  # k=numer kolumny w której $prog umieści wynik

PIDS=
#trap 'echo ; pstree -p $PPID ; echo "Childs: $PIDS" ; kill -KILL $PIDS ; exit 2' HUP INT QUIT TERM
PLIST=                                          # Lista kreowanych procesów (pid:kol)
for x in $list $k_list ; do

  name=${x%m}

  if [ "${prog%% *}" = "ssh" ]; then
    if ! ping_test $x ; then
      k=$((k+${#name}+1))
      continue                                  # Nie odpowiada na ping
    fi
  fi

  case "$label" in
  ssh) warn -G "${name#*@}" ;;                  # Dla ssh może być kilka linii
  yes) warn -G "${name#*@}" " : \c" ;;          # Explicite -e z \n
  YES) warn -G "${name#*@}" " : \c" ;;          # Jeśli bylo -k user@maszyna wycinamy user@
  esac

  eval $prog $x "$popt" $BG || true                     # Proces pid w tle
  [ -n "$BG" ] && PIDS="$PIDS $!" PLIST="$PLIST $!:$k"  # pid:kolumna

  k=$((k+${#name}+1))
done
PLIST=${PLIST# }                                # Bez początkowej spacji
#echo ; pstree -p $PPID ; echo "Childs: $PIDS"

[ -t 1 -a -z "$logline" ] && goto_wait          # Set cursor to a waiting place

wait                                            # Czekamy na wszystkie procesy

t1=$(date +%s)
t=$((t1-t0))

TMAX=12                                         # Max. czas czekania na wszystkie odpowiedźi

ts=${t}s
[ -z "$label" ] && ts="$(goto_col $k)$ts\c"     # Jeśli bez etykiet to czas na końcu
[ $t -gt 7 -a -z "$logline" -a $k -lt $MAXLINE ] && warn -Y "$ts"

if [ $t -gt $TMAX -a ! -t 2 ]; then             # stderr
  echo '/usr/bin/mail -s "$PROG $lab time=$t > $TMAX" ato < /dev/null'
  #loguj $LOGDIR/$PROG-err "$t $lab"
fi

[ -n "$BG" -a -t 1 -a -z "$logline" -a "${prog##*/}" != "lab1" ] && echo

[ "$logline" ] && { loguj $LOGDIR/lab-$lab "$(sort -n -t: -k1 $logline | cut -d: -f2- | tr '\n' ' ')" ; rm -f $logline ; }

exit 0