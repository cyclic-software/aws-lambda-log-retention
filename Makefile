.EXPORT_ALL_VARIABLES:

.EXPORT_ALL_VARIABLES:
BUCKET = $(shell aws ssm get-parameter --name /cyclic/artifacts/bucket | jq -r .Parameter.Value)
ACCOUNT = $(shell aws sts get-caller-identity | jq --raw-output .Account)
version = $(shell git rev-parse HEAD | cut -c1-8)
date = $(shell date '+%Y%m%d-%H%M')
APP_NAME = aws-lambda-log-retention


# Turn off the AWS cli v2 results pager
AWS_PAGER =

.SILENT:
.PHONY: help

## Prints this help screen
help:
	printf "Available targets\n\n"
	awk '/^[a-zA-Z\-\_0-9]+:/ { \
		helpMessage = match(lastLine, /^## (.*)/); \
		if (helpMessage) { \
			helpCommand = substr($$1, 0, index($$1, ":")-1); \
			helpMessage = substr(lastLine, RSTART + 3, RLENGTH); \
			printf "%-15s %s\n", helpCommand, helpMessage; \
		} \
	} \
	{ lastLine = $$0 }' $(MAKEFILE_LIST)

.PHONY: test
## Run unit tests
test:
	@npm run test

.PHONY: install
## Run appropriate NPM installs
install:
	@npm install

.PHONY: validate
## Validate template with: cfn-lint, aws cloudformation validate and sam validate
validate:
	@cfn-lint -t template.yaml
	@aws cloudformation validate-template --template-body file://template.yaml
	@sam validate -t template.yaml

.PHONY: build
build:
	@sam build

.PHONY: package
package: build
	@sam package \
		--s3-bucket ${BUCKET} \
		--s3-prefix ${APP_NAME}/${date}/${version} \
		--no-progressbar

.PHONY: deploy
deploy: package
	@sam deploy \
		--s3-bucket ${BUCKET} --s3-prefix ${APP_NAME}/${date}/${version} \
		--stack-name ${APP_NAME} \
		--capabilities CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND \
		--no-fail-on-empty-changeset \
		--no-confirm-changeset --region us-east-2 \
		--no-progressbar
