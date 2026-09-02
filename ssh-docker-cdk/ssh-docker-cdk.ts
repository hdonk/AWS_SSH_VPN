#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SshDockerCdkStack } from './lib/ssh-docker-cdk-stack';

const app = new cdk.App();
new SshDockerCdkStack(app, 'SshDockerCdkStack', {
  env: { account: 'ACCT', region: 'REGION' },
});

