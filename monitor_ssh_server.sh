#!/bin/sh
#set -x

# Wait for there to be an initial connection
  while [ 1 ]
  do
	  sleep 60

      CONNCOUNT=`netstat -an | grep :443 | grep ESTABLISHED | wc -l`

      if [ $CONNCOUNT -gt 0 ]
      then
         # There has been an initial connection. Wait until there aren't any for a period of time
         DISC_COUNT=0
         while [ 1 ]
         do
            sleep 10

            CONNCOUNT=`netstat -an | grep :443 | grep ESTABLISHED | wc -l`


            if [ $CONNCOUNT -eq 0 ]
            then
               DISC_COUNT=$(( ${DISC_COUNT} + 1 ))
            else
               # New connection found!
               break
            fi

            # No connections polled
            if [ ${DISC_COUNT} -ge 12 ]
            then
               killall -9 sshd
            fi
         done
     fi
  done
