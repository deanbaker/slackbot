import { Stack, StackProps, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Function, Code, Runtime } from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class CdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const myLambda = new Function(this, 'MyLambda', {
      runtime: Runtime.NODEJS_14_X,
      handler: 'app.handler',
      code: Code.fromAsset('../first-bolt-app'),
      timeout: Duration.seconds(10),
      environment: {
        "SLACK_BOT_TOKEN": "YOUR_TOKEN_HERE",
        "SLACK_SIGNING_SECRET": "YOUR_SECRET_HERE"
      }
    });

    const myApi = new apigw.LambdaRestApi(this, 'MyApi', {
      handler: myLambda,
      deployOptions: {
        stageName: "production",
        throttlingRateLimit: 1000,
        throttlingBurstLimit: 5000,
      }
    });

    const myTable = new dynamodb.Table(this, 'MyTable', {
      tableName: 'MyTable',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
    });

    const role = new iam.Role(this, 'MyLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    role.addToPolicy(new iam.PolicyStatement({
      actions: ['dynamodb:*'],
      resources: [myTable.tableArn],
    }));

    myLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['dynamodb:*'],
      resources: [myTable.tableArn],
    }));

    myLambda.addEnvironment('DYNAMODB_TABLE', myTable.tableName);
  }
}
