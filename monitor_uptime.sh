#!/bin/sh
#set -x

  while [ 1 ]
  do
	  sleep 60

      UPTIME=$(( ( $(cut -d' ' -f22 /proc/self/stat) - $(cut -d' ' -f22 /proc/1/stat) ) / 100 ))
      if [ $UPTIME -gt 7200 ]
      then
         killall -9 sshd
      fi
  done
