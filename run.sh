ssh-keygen -f '/home/nickh/.ssh/known_hosts' -R '[localhost]:443'
docker run -t -d \
--publish 443:443/tcp \
aws-sshserver-fargate:latest
