#!/bin/bash
rm -f ./id.rsa ./id_rsa.ppk ./keys
ssh-keygen -t rsa -b 4096 -f ./id_rsa
puttygen id_rsa -O private -o id_rsa.ppk
openssl rand -base64 32 > keys
cp ssh-docker-cdk/lib/lambda/createSshFargate.raw.ts ssh-docker-cdk/lib/lambda/createSshFargate.ts
APIKEY=`cat keys`
sed -i -e "s/APIKEY/${APIKEY}/" ssh-docker-cdk/lib/lambda/createSshFargate.ts
