# AWS_SSH_VPN
Builds a service on AWS that allows you to connect an ssh session to it, providing in effect a VPN that originates from AWS

    Copyright (C) 2026 Nick Hoath       

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.

    Please contact me through https://github.com/hdonk

On Unbuntu 24.04

From console
cd ~
mkdir vpn
cd vpn
git clone http://github.com/hdonk/AWS_Proxy_VPN
cd AWS_Proxy_VPN
# Packages
sudo apt install putty-tools curl ca-certificates
# Docker
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
# Logout of user needed!

# AWS CLI
curl -fsSL https://awscli.amazonaws.com/v2/install.sh | bash
export PATH=${HOME}/.local/bin:${PATH}
aws update
# AWS CDK
npm install -g aws-cdk
# Please note, running this command will delete existing keys, so back them up first if you are using them
# Hit return when asked for a passphrase
sh genkeys.sh

#Specify the region you want the vpn to be deployed in when you log in
aws login

sh build.sh
sh awspush.sh

cd ssh-docker-cdk
# Please install node ( https://nodejs.org/en/download )
\. "$HOME/.nvm/nvm.sh"
sudo ln -fs /home/nickh/.nvm/versions/node/v24.20.0/bin/node /usr/bin/node
sudo ln -fs /home/nickh/.nvm/versions/node/v24.20.0/bin/npm /usr/bin/npm
sudo ln -fs /home/nickh/.nvm/versions/node/v24.20.0/bin/npx /usr/bin/npx
sudo ln -fs /home/nickh/.nvm/versions/node/v24.20.0/bin/corepack /usr/bin/corepack
cdk bootstrap <aws://`aws sts get-caller-identity | jq -r '.Account' | sed -e 's/\r//' -e 's/\n//`/`aws configure get region`>

# Deploy the system to AWS
# This costs ~1 cents per day
cdk deploy

# This costs ~1 cent per hour, plus any data transfer costs above the free tier.
# The vpn service will shut itself down after a few minutes without a connection
# Find the startup Lambda URL (SshDockerCdkStack.myFunctionUrlOutput:) then:
curl https://URL/?apikey=`cat ../keys|sed -e 's/+/%2b/g'`
# RUNNING THIS MORE THAN ONCE WILL LEAVE UP AN INSTANCE OF THE VPN SERVER UNTIL IT
# EXPIRES - currently ~ 3 minutes

# this will output the IP address of the VPN/SSH proxy service.
# Example connection in the connect.sh file 
cd ..
sh connect.sh IP

# When finished with the infra
cd ssh-docker-cdk
cdk destroy

