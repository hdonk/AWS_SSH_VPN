import {
  DescribeServicesCommand,
  ECSClient,
  UpdateServiceCommand,
  RunTaskCommand,
  DescribeTasksCommand,
  DescribeTasksCommandOutput,
} from "@aws-sdk/client-ecs";
import {
  EC2Client,
  DescribeNetworkInterfacesCommandOutput,
  DescribeNetworkInterfacesCommand,
} from "@aws-sdk/client-ec2";

const REGION = process.env.REGION;
const CLUSTER = process.env.CLUSTER;
const SERVICE = process.env.SERVICE;
const TASKDEF = process.env.TASKDEF;
const SUBNETS = process.env.SUBNET_IDS;
const SG = process.env.SG;

const ecs = new ECSClient({ region: REGION });
const ec2 = new EC2Client({ region: REGION });

const apikey = "APIKEY";

export async function handler(event: any) {

//  console.log("event: " + JSON.stringify(event, null, 2) );

//  console.log("QS: " + event.queryStringParameters.apikey);

  if(event.queryStringParameters.apikey != apikey)
  {
    return {
       statusCode: 503,
    };
  }

//  console.log("REGION: " + REGION);
//  console.log("CLUSTER: " + CLUSTER);
//  console.log("SERVICE: " + SERVICE);
//  console.log("TASKDEF: " + TASKDEF);
//  console.log("SUBNETS: " + SUBNETS);
//  console.log("SG: " + SG);

  if (REGION == null || CLUSTER == null || SERVICE == null || TASKDEF == null || SUBNETS == null || SG == null) {
    throw new Error("Missing environment variables");
  }

/*  const response = await ecs.send(
    new DescribeServicesCommand({
      cluster: CLUSTER,
      services: [SERVICE],
    })
  );

  const desired = response?.services?.[0].desiredCount;

  if (desired === 0) {
    await ecs.send(
      new UpdateServiceCommand({
        cluster: CLUSTER,
        service: SERVICE,
        desiredCount: 1,
      })
    );

    console.log("Updated desiredCount to 1");
  } else {
    console.log("desiredCount already at 1");
  }
*/

   var ecsTask = await ecs.send(
      new RunTaskCommand({
        cluster: CLUSTER,
        taskDefinition: TASKDEF,
        launchType: "FARGATE",
        networkConfiguration: {
          awsvpcConfiguration: {
            subnets: SUBNETS.split(","),
            assignPublicIp: "ENABLED",
            securityGroups: SG.split(","),
          }
        }
      })
    );
    const taskArn = ecsTask.tasks?.[0].taskArn!;
    const taskEni = await getEni(CLUSTER, taskArn);
    const publicIp = await getPublicIp(taskEni);
    return {
       statusCode: 400,
       body: publicIp,
    };
}



const getEni = async (clusterName: string, taskArn: string): Promise<string> => {
  let taskEni: string | undefined;
  do {
    const describeTasksCommandOutput: DescribeTasksCommandOutput = await ecs.send(
      new DescribeTasksCommand({
        cluster: clusterName,
        tasks: [taskArn]
      })
    );

    taskEni = describeTasksCommandOutput.tasks?.[0].attachments?.[0].details?.find((detail) => detail.name === 'networkInterfaceId')?.value;

    if (taskEni === undefined) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      continue;
    }

    return taskEni;
  } while (true);
};

const getPublicIp = async (taskEni: string): Promise<string> => {
  let publicIp: string | undefined;
  do {
    const describeNetworkInterfacesCommandOutput: DescribeNetworkInterfacesCommandOutput = await ec2.send(
      new DescribeNetworkInterfacesCommand({
        NetworkInterfaceIds: [taskEni]
      })
    );

    publicIp = describeNetworkInterfacesCommandOutput.NetworkInterfaces?.[0].Association?.PublicIp;

    if (publicIp === undefined) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      continue;
    }

    return publicIp;
  } while (true);
};

