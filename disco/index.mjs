import { CloudFormationClient, DescribeStackResourcesCommand } from '@aws-sdk/client-cloudformation'
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

export async function handler (event) {
  console.log('Custom Resource Event:', JSON.stringify(event, null, 2))

  const requestType = event.RequestType
  const stackName = event.StackId.split('/')[1]
  
  // Always respond to CloudFormation
  const response = {
    Status: 'SUCCESS',
    PhysicalResourceId: `disco-${stackName}`,
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId
  }

  try {
    if (requestType === 'Create' || requestType === 'Update') {
      // Initialize AWS clients
      const cfnClient = new CloudFormationClient({})
      const dynamoClient = new DynamoDBClient({})
      const s3Client = new S3Client({})

      // Get all stack resources
      const describeCommand = new DescribeStackResourcesCommand({
        StackName: stackName
      })
      const { StackResources } = await cfnClient.send(describeCommand)

      // Build resource map: { resourceName: resourceArn }
      const resourceMap = {}
      for (const resource of StackResources) {
        const name = resource.LogicalResourceId
        const arn = resource.PhysicalResourceId
        resourceMap[name] = arn
      }

      console.log('Discovered resources:', resourceMap)

      // Store in DynamoDB
      const putItemCommand = new PutItemCommand({
        TableName: process.env.DISCO_TABLE,
        Item: {
          idx: { S: 'resources' },
          data: { S: JSON.stringify(resourceMap) }
        }
      })
      await dynamoClient.send(putItemCommand)

      // Store in S3
      const putObjectCommand = new PutObjectCommand({
        Bucket: process.env.DISCO_BUCKET,
        Key: 'resources.json',
        Body: JSON.stringify(resourceMap, null, 2),
        ContentType: 'application/json'
      })
      await s3Client.send(putObjectCommand)

      console.log('Successfully stored resource discovery data')
    }

    // Send success response to CloudFormation
    await sendResponse(event, response)
  } catch (error) {
    console.error('Error:', error)
    response.Status = 'FAILED'
    response.Reason = error.message
    await sendResponse(event, response)
  }
}

async function sendResponse(event, response) {
  const responseBody = JSON.stringify(response)
  const https = await import('https')
  const { URL } = await import('url')
  
  const parsedUrl = new URL(event.ResponseURL)
  const options = {
    hostname: parsedUrl.hostname,
    port: 443,
    path: parsedUrl.pathname + parsedUrl.search,
    method: 'PUT',
    headers: {
      'Content-Type': '',
      'Content-Length': responseBody.length
    }
  }

  return new Promise((resolve, reject) => {
    const request = https.request(options, (res) => {
      console.log('CloudFormation response status:', res.statusCode)
      resolve()
    })
    request.on('error', reject)
    request.write(responseBody)
    request.end()
  })
}
