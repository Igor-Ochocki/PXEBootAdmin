#!/bin/sh
# boot
# Selekcja podnoszonego systemu
# ato 2014-2024

# /www/boot/select.cgi                                  # Implementacja

DOMAIN=zet.pw.edu.pl                                    #
SERVER=nas2                                             # Serwer WWW
LOG="/log/www"                                          # i jego log

SELECTDIR=/www/boot/select                              # Katlog zawierający linki-selektory

TWAIT=30                                                # Minimalny czas ważności selekcji w sek.

usage () {
  echo "użycie: $PROG -opcje maszyna system [wersja] [typ]  # Ustaw system podnoszony na maszynie
 -l : aktualna selekcja w postaci szczegółowej (kto kiedy ustawił)
 -s : lista systemów do dyspozycji
 -v system : lista wersji systemu 'system'
 -d : pełna dokumentacja
 -q : bez komunikatów (quiet)
 -t czas : czas przez jaki ma obowiązywać wpis, przyrostki: s/m/g/d (def. ${TWAIT}s)
system = '-'  oznacza polecenie usunięcia wpisu.
DIR: $SELECTDIR -> $(realpath $SELECTDIR)
CGI: $SELECTDIR.cgi (definicje grup: $(sed -n '/).*sel=[^ ]/{s/.*\=//;s/ ;;//p}' $SELECTDIR.cgi | tr '\n' ' ')"
warn -m "Informacje:"
 echo "\
 $PROG                        : Aktualne selekcje grupowe i indywidualne
 $PROG -s                     : Lista dostępnych systemów
 $PROG system -v              : Lista dostępnych wersji dla konkretnego systemu (na zielono def.)"
warn -m "Ustawienie systemu:"
 echo "\
 $PROG maszyna system wersja  : Trwały wpis - na maszynie podnoś podany system
 $PROG maszyna -              : Usunięcie wpisu
 $PROG -t czas maszyna system : Wpis na określony czas (powrót do aktualnej wersji po jego upływie)"
warn -m "Dziennik:"
 echo "\
 $PROG log                    : log startu dowolnej maszyny (pobierane pliki) tylo root!
 $PROG maszyna log            : log maszyny (można zmienić kolejność: log maszyna)"
warn -m "Maszynę można określić przez nazwę (hostname) lub adres MAC (numeryczny lub nazwa)
Można również podać grupę maszyn przez podanie numeru laboratorium np. 225
np."
 echo "\
 $PROG s7 ubuntu -v           : Pokaż dostępne wersje Ubuntu
 $PROG s5 ubuntu 20.10        : Na stacji s5 podnoś Ubuntu 20.10
 $PROG s3 log                 : Dziennik serwera www dla s3
 $PROG s7 -                   : Usuń wpis dla s7
 $PROG -t 1g s1,s2 freebsd    : Przez godzinę FreeBSD na s1 i s2"
  exit
}

. ZLIB                                                  # fatal

dns2ip () { # dns-name                                  # name -> IP
  dig $1.$DOMAIN +short 2>/dev/null
}

time2sec () { # czas[smgh]                              # Przeliczenie czasu na sek.
  case "$t" in
  *s) t=${t%s} ;;                                       # Sekundy
  *m) t=$((${t%m}*60)) ;;                               # Minuty
  *g) t=$((${t%g}*60*60)) ;;                            # Godziny
  *h) t=$((${t%h}*60*60)) ;;                            # Godziny
  *d) t=$((${t%d}*60*60*24)) ;;                         # Dni
  esac
}

Setup () { # maszyna system [ver] [typ]                 # Ustaw/skasuj/ustaw-czasowo
  host=$1  system="$2 $3 $4"  t=$CZAS
  system=${system%% } ; system=${system%% }             # Bez spacji końcowych
  if [ "$t" ]; then                                     # Usuń wpis po czasie
    time2sec $t
    [ $t -lt $TWAIT ] && t=$TWAIT                       # Min. 30s
    old=$($PROG $host) ; old=${old#* -> }
    [ -z "$old" ] && old="-"
    $PROG -q $host "$system" > /dev/null &&
    nohup sh -c "sleep $t && $PROG $host '$old'" > /dev/null &
    # TODO via at dla długich czasów ?
  fi
  if [ "${system% }" = "-" ]; then                      # Skasowanie
    rm $SELECTDIR/$host 2> /dev/null || fatal 'nie mogę usunąć:' " $host"
    echo "deleted"
  else
    case "${system%% *}" in
      http*) ;;
    iscsi:*) ;;
          *) file=${SELECTDIR%/*}/${system%% *}.ipxe
             [ -f "$file" ] || fatal 'brak pliku:' " $file"
    esac
    cd $SELECTDIR
    ln -v -sf$h "$system" $host | sed "s/'//g"
  fi
}

Show () { # host [l]                                    # TODO algorytm selekcji aby pokazywal co zrobi bootselect.cgi
  host=$1
  cd $SELECTDIR
  if [ -e "$host" -o -L "$host" ]; then
    if [ "$lopt" ]; then                                # Długi format (long)
      ls -l $host
    else                                                # Krótki
      x=$(ls -l $host) ; x=${x#* } ; x=${x#* } ; x=${x#* }
      owner=${x%% *} ; target=${x##* -\> }
      if [ $owner = $USER ]; then
        owner=
      else
        t='-time-style='
        case "$(uname)" in FreeBSD) t=t ;; esac
        dat=$(stat -f %Sm -$t '%F %T' $host)            # 2014-11-17 00:56:41
        owner=" ($owner $dat)"
      fi
      #echo "$host -> $target$owner"
      warn -G "$Host" : " $target$owner"
    fi
  else
    echo '-'
  fi
  [ "$t" ] && echo "wpis zostanie skasowany o godz. $(date -v+${t}S +%T)"
  exit 0
}

# format nginx na nas:
#46.232.129.204 - - [16/Jul/2015:22:54:50 +0200] "GET /pub/VM/VMware/ESXi-5.5.0-20150504001/modules/sbin.tgz HTTP/1.1" 200 20480 "-" "iPXE/1.0.0+ (6b71)"
Show_log () { # host log lines                          # Pliki pobierane z http://nas przez maszyne
  local ssh_www                                         # Log na zdalnej maszynie ?
  host=$1                                               # $2='log'
  N=${3:-5}                                             # liczba wyświetlanych linii
  test -f $LOG || fatal 'brak pliku: ' "$LOG"
  #typ=access
  #typ=error
  case "$host" in
       log) ip=  host= ;;                               # boot log
  [0-9\.]*) ip=$host ;;                                 # TODO RE IP
         *) ip=$(dns2ip $host) ;;                       #
  esac

  [ "$(hostname -s)" = "$SERVER" ] || ssh_www="ssh $SERVER"

  L1="/boot/select.cgi?hostname=$host"                  # Najnowszy start PXE
  l1=$(grep -n "$ip .* $L1" $LOG | sed -n '$s/:.*//p')
  [ "$l1" ] || { warn -G "$1" ; fatal 'brak: ' "$L1" ;}

  le=$(wc -l $LOG) ; le=${le%% *}                       # Ostatnia linia pliku

  STA=$(sed -n "$l1{s|.*- - \[||; s|:.*||p;q}" $LOG)    # Data startu np. 25/Apr/2024
  DAT=$(LANG= date '+%d/%b/%Y')                         # Data dzisiejsza 27/Apr/2024
  if [ "$DAT" = "$STA" ]; then                          # Start dzisiaj ?
     OLD=
  else                                                  # Nie - dodajemy datę
     DAT=$STA
     M=${STA%/*} ; M=${M#*/}
     OLD="$M-${STA%%/*}"                                # Apr-25
  fi
  DEL="s| $SERVER nginx:||;s|- - \[$DAT:||;s|+0200] \"GET ||;s|HTTP/1.1\" 200||;s|\"-\" ||" # zbędne elementy
  SED="$DEL;s|^$ip ||;s|$ip|$host|g"

  LL=$($ssh_www sed -n "$l1,\$p" $LOG | grep -cw "$ip") # Czytanie iso dla FreeBSD po 2K daje ~19K linii
  if [ $LL -gt $N ]; then                               # Poprzednie dni
    SEP="........ $((LL-N)) linii"
    Select="awk 'NR <= $N {print} {line[NR] = \$0} END { print \"$SEP\" ; for (i = NR-2+1; i <= NR; i++) print line[i]}'"
    #Select="{tee >(tail -n 2 >&3) | head -n $N;} 3>&1"
    #OLD="$OLD $LL linii"
  else
    #Select="tail -$N"
    Select="cat"
  fi

  warn -G "$1 " "$OLD"                                  # $* : DEBUG "log" lub "s1 log"
  eval "$ssh_www sed -n '$l1,\$p' $LOG | grep -w '$ip' | $Select | sed '$SED'"
}

List () { # [host] # $lopt                              # Lista zwięzła lub długa
  if [ "$lopt" ]; then
    FMT='%-8s %s %5s  '                                 # User data czas
    printf "$FMT" Kto ' Kiedy ustawil' ; echo 'Jak'
    echo '----------------------------------------'
  else
    FMT='%s '
  fi
  D="-time-style=+" ; case "$(uname)" in FreeBSD) D=D ;; esac
  (cd $SELECTDIR ; ls -la -$D'%F %k:%M' $1 2>/dev/null) | grep ^l |
  while read f n u g l D T komp sys ; do                # flags 1 user group dlugosc_nazwy Data Czas komp -> target
    #echo "$f $n $u $g $l $D $T $komp $sys" ; continue
    case "$komp" in                                     # g = nr.grupy
    default) g=0 ;;
    *:*:*:*) g=5 ;;     # MAC
     [0-9]*) g=1 ;;     # lab
         ??) g=2 ;;     # lab
        ???) g=3 ;;     # lab
          *) g=4 ;;     # komp
    esac
    echo -n "$g |"
    [ "$lopt" ] && printf "$FMT" $u $D $T
    echo "$(lab $komp) $sys"
  done | sort | sed 's/^.*|//'
}

List2 () {                                              # Lista - kto definował
  echo $SELECTDIR
  #ls -la $SELECTDIR | grep ^l ;;
  D="-time-style=+" ; case "$(uname)" in FreeBSD) D=D ;; esac
  ls -la -$D'%F %H:%M' $SELECTDIR | cut -w -f3,6-
}

Oslist () { # [os]                                      # Lista możliwych systemów lub wersji konkretnego
  local GRE='\\e[32m' NOR='\\e[m'                       # Ziel. Dodatkowy '\'
  os=$1
  cd ${SELECTDIR%/*}
  case "$os" in
  '') warn -B 'Systemy;' ; ls *.ipxe | sed 's|.ipxe||' | column | column -t ;;
   *) echo $e Wersje: $(sed -n "/^#VER:/{s|||;s|\[|$GRE|;s|\]|$NOR|p;q;}" $os.ipxe)\
                Typy: $(sed -n "/^#TYP:/{s|||;s|\[|$GRE|;s|\]|$NOR|p;q;}" $os.ipxe)
      exit 0 ;;
  esac
}

# START

PROG=${0##*/}

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

cmd=List
while getopts hlLvfdeqst:x opt ; do
  case "$opt" in
  l) lopt="-l"          ;;                              # Lista długa
  L) cmd=Show           ;;                              # XXX do usunięcia
  f) cmd=Show_log       ;;
  v) cmd=Oslist         ;;                              # system -v  : lista wersji systemu
  d) exec cat $SELECTDIR/README ;;
  e) exec $EDITOR $SELECTDIR/README ;;
  q) quiet=yes          ;;
  s) cmd=Oslist         ;;                              # Lista systemów lub wersji systemu
  t) CZAS=$OPTARG       ;;                              # Czas ważności wpisu
  x) x=-x ; set $x      ;;
  *) usage              ;;
  esac
done
shift $((OPTIND-1))

e=-e ; [ -n "$(echo -e)" ] && e=                        # [ "$(uname)" = "Linux" ] && e=

case "$1" in
 '') ;;
  ?) x=$1 ; shift ; set -- $x\? $* ;;                   # np. s -> s\?  XXX brak 1-literowych nazw
log) cmd=Show_log       ;;                              # log [host] [opt]
  *) case "$2" in                                       #
     '')                ;;                              # host          : list    (krótkie info)
      l) lopt="-l"      ;;                              # host -l|l     : list -l (długie info)
    lo*) cmd=Show_log   ;;                              # host lo*      : log
      *) cmd=Setup      ;;                              # host "system [wersja]" [czas] : ustawienie
     esac ;;
esac

$cmd "$@"

exit