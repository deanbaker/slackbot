const { App, AwsLambdaReceiver } = require('@slack/bolt');

const awsLambdaReceiver = new AwsLambdaReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});


var app;

if (process.env.NODE_ENV == 'development') {
  app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,

    port: process.env.PORT || 3000,

  });

  (async () => {
    // Start your app
    await app.start(process.env.PORT || 3000);

    console.log('⚡️ Bolt app is running in dev mode!');
  })();

}
else {
  app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    // signingSecret: process.env.SLACK_SIGNING_SECRET,
    //   socketMode: true,
    //   appToken: process.env.SLACK_APP_TOKEN,
    // Socket Mode doesn't listen on a port, but in case you want your app to respond to OAuth,
    // you still need to listen on some port!
    port: process.env.PORT || 3000,
    receiver: awsLambdaReceiver
  });

  module.exports.handler = async (event, context, callback) => {
    const handler = await awsLambdaReceiver.start();
    return handler(event, context, callback);
  }
}

// Listens to incoming messages that contain "hello"
app.message('hello', async ({ message, say }) => {
  console.log('Received hello');
  // say() sends a message to the channel where the event was triggered
  await say(`Hey there <@${message.user}>!`);
});


