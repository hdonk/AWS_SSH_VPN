#!/bin/bash
IP=$1
ssh -v ${IP} -p 443 -i id_rsa
