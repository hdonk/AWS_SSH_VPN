#!/bin/sh
set -x

# Start script in background to monitor number of users in the room
nohup /usr/local/bin/monitor_ssh_server.sh \
  > /dev/stdout &
nohup /usr/local/bin/monitor_uptime.sh \
  > /dev/stdout &
ssh-keygen -A
`which sshd` -D

