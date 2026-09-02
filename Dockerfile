FROM public.ecr.aws/docker/library/alpine:3.16.2 AS build

# Install build dependencies
RUN apk add --no-cache \
  openssh shadow

RUN useradd --password '*' nickh
RUN mkdir -p /usr/local/

COPY monitor_ssh_server.sh /usr/local/bin
COPY monitor_uptime.sh /usr/local/bin
COPY id_rsa.pub /home/nickh/.ssh/authorized_keys
RUN chown nickh:nickh /home/nickh/.ssh/authorized_keys
RUN chmod 600 /home/nickh/.ssh/authorized_keys
COPY ssh_server.sh /usr/local/bin/
COPY sshd_config /etc/ssh
RUN mkdir /var/run/sshd

EXPOSE 443/tcp

CMD ["/usr/local/bin/ssh_server.sh"]
