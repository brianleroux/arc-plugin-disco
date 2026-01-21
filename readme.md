# arc-plugin-disco

Resource discovery plugin for Architect Framework applications. Automatically catalogs AWS infrastructure metadata and makes it available to your application at runtime.

## what it does

When you deploy your Architect app, this plugin:
- Discovers all CloudFormation resources in your stack
- Stores resource ARNs and identifiers in S3 and DynamoDB
- Cleans up automatically when you destroy your stack

No more hardcoding ARNs or managing environment variables for every resource.

## installation

```bash
npm install arc-plugin-disco
```

Add to your `app.arc`:

```arc
@app
myapp

@plugins
arc-plugin-disco

@http
get /
```

## how it works

The plugin creates:
- **S3 bucket** - Stores `resources.json` with all stack resources
- **DynamoDB table** - Stores resource map with `idx: 'resources'`
- **disco-up Lambda** - Runs after stack creation/update to catalog resources
- **disco-down Lambda** - Runs before stack deletion to clean up S3 bucket

All Lambda functions in your stack automatically get `DISCO_BUCKET` and `DISCO_TABLE` environment variables.

## accessing resources

The `DISCO_BUCKET` and `DISCO_TABLE` environment variables are automatically available in all your Lambda functions. Use them to read the resource map:

```javascript
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'

const s3 = new S3Client({})
const response = await s3.send(new GetObjectCommand({
  Bucket: process.env.DISCO_BUCKET,
  Key: 'resources.json'
}))

const resources = JSON.parse(await response.Body.transformToString())
console.log(resources.MyTable) // arn:aws:dynamodb:...
```

Or from DynamoDB:

```javascript
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb'

const dynamo = new DynamoDBClient({})
const response = await dynamo.send(new GetItemCommand({
  TableName: process.env.DISCO_TABLE,
  Key: { idx: { S: 'resources' } }
}))

const resources = JSON.parse(response.Item.data.S)
```

## development

```bash
# run tests
npm test

# preview deployment changes
npm run dryrun

# deploy to aws
npm run deploy

# destroy stack
npm run destroy
```

## testing

Tests use Node.js native test runner (no external dependencies):

```bash
npm test
```

Test coverage includes:
- Plugin configuration and CloudFormation resource generation
- disco-up Lambda event handling and resource discovery
- disco-down Lambda S3 cleanup logic

## architecture

```
CloudFormation Stack
├── DiscoBucket (S3)
├── DiscoTable (DynamoDB)
├── disco-up Lambda
│   └── DiscoUpCustomResource (runs after all resources created)
└── disco-down Lambda
    └── DiscoDownCustomResource (runs before bucket deletion)
```

The plugin uses CloudFormation custom resources to trigger Lambda functions at the right lifecycle moments.

## license

Apache-2.0
