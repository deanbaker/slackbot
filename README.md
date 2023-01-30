# Slack App Template
This codebase is a simple example of getting a slack bot up and running, hosted in AWS via Lambda and APIGateway.

My intention is to iterate on it to make it more robust and scalable, eventually giving me the ability to spin up multi-tenanted slack apps quickly and easily.

## The stack
I have chosen AWS as the cloud provider, since this is where I have the most experience. We will be using the AWS CDK framework to deploy the thing. At the moment it is a simple API Gateway -> Lambda set up, eventually using DynamoDB to persist tokens for when we actually deploy to production.

# Create your app
Pretty straight forward - I follow the steps found on [This Tutorial](https://slack.dev/bolt-js/tutorial/getting-started)

Follow up until you get your `token` and `signingSecret` and make sure you can put them in your environment to start testing locally

# Running locally

I am a huge fan of being able to run an app locally, without too much fuss. This codebase is designed to be able to do just that. Get running as quickly as possible so we can iterate.

Take the tokens you created from the tutorial above and set up your environment:
```sh
export SLACK_SIGNING_SECRET=YOUR_SECRET
export SLACK_BOT_TOKEN=YOUR_TOKEN
```

You can now start your app. From the `bolt-app` directory you can run `npm run dev` - or from the root of the project you can run `make start`. Personally I like to use Makefiles for all the things.

## Ngrok
[Ngrok](https://ngrok.com/) s a simplified API-first ingress-as-a-service that adds connectivity, security, and observability to your apps with no code changes. 
You will have to create an account, the steps are very straight forward.

What that means is, we can create a publically available endpoint that will eventually hit our node app running locally. 

```sh
ngrok http 3000
```
You should see something like this:
```sh
Session Status                online
Account                       xxx.xxxxx@gmail.com (Plan: Free)
Version                       3.1.1
Region                        Australia (au)
Latency                       23ms
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://xxx-xxx-xxx-xxx-xxx.au.ngrok.io -> http://localhost:3000   
```

### Wire it up
We will be using Slacks `events-api` to communicate back to our bot, not the `websockets` they use in the tutorial. You can [read more about them here](https://api.slack.com/apis/connections/events-api)

When your app is running, you can set up a valid request url using Ngrok to forward to our local. Set the url to be `https://xxx-xxx-xxx-xxx-xxx.au.ngrok.io/slack/events` - don't forget the `/slack/events` bit at the end!

### Test it
You should now have your app installed, invite it into a channel and say `hello` - see what you get!

## Docker / Localstack
There is a `docker-compose.yml` in the root of the repo that we can use to deploy the lambda in a "production" like environment. To be honest, this has not worked out well for me - I get weird duplicate messages via API Gateway when I hook it all up.

You will notice we have three services - `dynamo,apigateway,lambda`

```sh
docker-compose up
```

### CDK
We can deploy the thing to localstack - but as I said I had mixed results. To get this going, you are going to want to install
- [CDK](https://github.com/aws/aws-cdk)
- [CDK Local](https://github.com/localstack/aws-cdk-local)

A gotcha with CDK is that you need to configure AWS even if you aren't connecting to the real deal. It doesn't care about secrets etc, it just needs the data

```sh
aws configure
```

Now we can deploy the thing

```sh
cdklocal bootstrap
cdklocal deploy
```

Once you have deployed successfully you will see the endpoint of your api gateway:
```sh
Outputs:
CdkStack.MyApiEndpoint869ABE96 = https://1g0l4d7jc3.execute-api.localhost.localstack.cloud:4566/production/
```

### Ngrok
We are still going to have to give Slack a meaningful endpoint for us to get connectivity. We still use Ngrok, but the way localstack works means we need to tweak things a bit using the `--host-header` flag to ensure localstack knows what to do with the request. If we don't do this, you will get S3 responses, which isn't ideal.

We will use the `Output` of the CDK deploy above to rewrite the header: 

```sh
ngrok http --host-header=rewrite 1g0l4d7jc3.execute-api.localhost.localstack.cloud:4566
```

### Wire it up
Simply follow the same steps above to ensure that we are wiring this thing up correctly. Note that there is an extra `/production` element on the url that is created as part of the API Gateway stage.


