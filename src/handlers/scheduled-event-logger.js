var AWS = require("aws-sdk");
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-2',
});
var cloudwatchlogs = new AWS.CloudWatchLogs();

const retentionInDays = process.env.LambdaLogRetentionDays || 7

async function updateLogGroups() {
  var params = {
    limit: '5',
    logGroupNamePrefix: '/aws/lambda/'
  };
  var next = true

  while(next) {
    var logs = await cloudwatchlogs.describeLogGroups(params).promise()

    logs.logGroups.forEach(async e => {
      if (e.retentionInDays === undefined) {
        // console.log(JSON.stringify(e,null,2))
        console.log(e.logGroupName)
        var retentionParams = {
          logGroupName: e.logGroupName,
          retentionInDays: retentionInDays
        };
        var res = await cloudwatchlogs.putRetentionPolicy(retentionParams).promise()
        console.log(JSON.stringify(res,null,2))
      }
    });
    // console.log(logs)
    if (logs.nextToken) {
      params.nextToken = logs.nextToken
    } else {
      next = false;
    }
  }


  // logs.then(
  //   function(data) {
  //     console.log(JSON.stringify(data.logGroups,null,2))
  //     data.logGroups.forEach(e => {
  //       if (e.retentionInDays === undefined) {
  //         console.log(JSON.stringify(e,null,2))
  //       }
  //     });
  //   },
  //   function(err) {
  //     console.log(err, err.stack)
  //   }
  // );
}

/**
 * A Lambda function that logs the payload received from a CloudWatch scheduled event.
 */
exports.scheduledEventLoggerHandler = async (event, context) => {
    // All log statements are written to CloudWatch by default. For more information, see
    // https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-logging.html
    console.info(JSON.stringify(event));
    await updateLogGroups()
}

exports.updateLogGroups = updateLogGroups
