import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import path from 'path';
import * as lambda_ from 'aws-cdk-lib/aws-lambda';
import { Vpc, SecurityGroup, Peer, Port, SubnetType } from 'aws-cdk-lib/aws-ec2';
import { FargateService, FargateTaskDefinition, Cluster, ContainerImage, Protocol, LogDriver } from 'aws-cdk-lib/aws-ecs';
import { Policy, PolicyStatement, AccountPrincipal } from 'aws-cdk-lib/aws-iam';
import { Repository } from 'aws-cdk-lib/aws-ecr';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { RemovalPolicy } from 'aws-cdk-lib/core';
export class SshDockerCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const clusterName = "SSH_DOCKER_CLUSTER";
    const serviceName = "SSH_DOCKER";

    const logRetention = RetentionDays.ONE_DAY 

    const logGroup = new LogGroup(this, 'ServiceLogGroup', {
      logGroupName: "VPNLogGroup",
      removalPolicy: RemovalPolicy.DESTROY,
      retention: logRetention 
    });

    const vpc = new Vpc(this, "Vpc", {
      maxAzs: 1,
      natGateways: 0,
      subnetConfiguration: [ { 
         cidrMask: 24,
         name: 'public-vpc',
         subnetType: SubnetType.PUBLIC,
         mapPublicIpOnLaunch: true,
      } ]
    });
    const cluster = new Cluster(this, "EcsCluster", {
      vpc: vpc,
      clusterName
    });


    const securityGroup = new SecurityGroup(this, "SG", {
       vpc: vpc,
       allowAllOutbound: true,
    });
    securityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(443), "SSH from HTTPS port from anywhere");

    const taskDefinition = new FargateTaskDefinition(this, "TaskDef", {
        cpu: 256,
        memoryLimitMiB: 512,
    });

    const repo = Repository.fromRepositoryArn(
            this,
            'Servic1Repo',
            `arn:aws:ecr:us-east-2:009390618732:repository/sshserver/core`
        );
    const container = taskDefinition.addContainer("web", {
       image: ContainerImage.fromEcrRepository(repo, "latest"),
       logging: LogDriver.awsLogs({
         streamPrefix: "log-vpn",
         logGroup,
      }),  
    });

   container.addPortMappings({ containerPort: 443, protocol: Protocol.TCP,
                               hostPort: 443 });

    const fargateService = new FargateService(
      this,
      "SshDockerFargateService",
      {
        cluster,
        taskDefinition,
        serviceName,
        assignPublicIp: true,
        desiredCount: 0,
        securityGroups: [securityGroup],
      }
    );

    // Give the Lambda function permission to start the Fargate Service
    const ecsPolicy = new Policy(this, "EcsPolicy", {
      statements: [
        new PolicyStatement({
          actions: ["ecs:UpdateService", "ecs:DescribeServices", ],
          resources: [fargateService.serviceArn, fargateService.taskDefinition.taskDefinitionArn],
        }),
        new PolicyStatement({
          actions: [ "ecs:DescribeTasks", "ec2:DescribeNetworkInterfaces" ],
          resources: [ "*" ],
        }),
      ],
    });

    let publicsubnets = "";
    for(let i=0; i<vpc.publicSubnets.length; i++){
       if(i!=0){
          publicsubnets += ",";
       }
       publicsubnets += vpc.publicSubnets[i].subnetId;
    }
    let securitygroups = securityGroup.securityGroupId;

    const myFunction = new NodejsFunction(this, "SshDockerFargateLambda", {
      entry: path.join(__dirname, "lambda/createSshFargate.ts"),
      timeout: cdk.Duration.minutes(1),
      environment: {
        CLUSTER: clusterName,
        SERVICE: serviceName,
        REGION: this.region,
        TASKDEF: taskDefinition.family,
        SUBNET_IDS: publicsubnets,
        SG: securitygroups,
        },
    });

    myFunction.role?.attachInlinePolicy(ecsPolicy);

    taskDefinition.grantRun(myFunction);

    const myFunctionUrl = myFunction.addFunctionUrl({
      authType: lambda_.FunctionUrlAuthType.NONE,
    });
	myFunction.grantInvoke(new AccountPrincipal('*'));

    new cdk.CfnOutput(this, "myFunctionUrlOutput", {
      value: myFunctionUrl.url,
    })

  }
}

