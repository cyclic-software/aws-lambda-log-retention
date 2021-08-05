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

  try {
    while(next) {
      var logs = await cloudwatchlogs.describeLogGroups(params).promise()

      logs.logGroups.forEach(async e => {
        if (e.retentionInDays === undefined) {
          // console.log(JSON.stringify(e,null,2))
          console.log(`No retentionInDays set on: ${e.logGroupName}`)
          var retentionParams = {
            logGroupName: e.logGroupName,
            retentionInDays: retentionInDays
          };
          var res = await cloudwatchlogs.putRetentionPolicy(retentionParams).promise()
          // console.log(JSON.stringify(res,null,2))
        }
      });
      // console.log(logs)
      if (logs.nextToken) {
        params.nextToken = logs.nextToken
      } else {
        next = false;
      }
    }
  } catch(error) {
    console.log(error)
  }
}

exports.scheduledEventLoggerHandler = async (event, context) => {
    console.info(JSON.stringify(event));
    await updateLogGroups()
}

exports.updateLogGroups = updateLogGroups
