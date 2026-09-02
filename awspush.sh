#!/bin/bash
REGION=`aws configure get region`
ACCOUNT=`aws sts get-caller-identity | jq -r '.Account' | sed -e 's/\r//' -e 's/\n//`
aws ecr get-login-password --region ${REGION} | sudo docker login --username AWS --password-stdin ${ACCOUNT}.dkr.ecr.us-east-2.amazonaws.com
docker build -t sshserver/core .
docker tag sshserver/core:latest ${ACCOUNT}.dkr.ecr.us-east-2.amazonaws.com/sshserver/core:latest
docker push ${ACCOUNT}.dkr.ecr.${REGION}.amazonaws.com/sshserver/core:latest
