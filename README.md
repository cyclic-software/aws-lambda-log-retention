# aws-lambda-log-retention

Annoyed that Lambda will only log to CloudWatch log groups that are named: `/aws/lambda/${FunctionName}`

This app will set all log group retention policies every morning at 10:10 UTC
