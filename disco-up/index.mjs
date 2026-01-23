import { CloudFormationClient, DescribeStackResourcesCommand } from '@aws-sdk/client-cloudformation'
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { extractStackId } from './stack-id-extractor.mjs'
import { organizeByPragma } from './pragma-organizer.mjs'

export async function handler (event) {
  console.log('Custom Resource Event:', JSON.stringify(event, null, 2))

  const requestType = event.RequestType
  const stackId = extractStackId(event.StackId)
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
      // Validate environment variables
      if (!process.env.DISCO_BUCKET || !process.env.DISCO_TABLE) {
        const error = 'Missing required environment variables: DISCO_BUCKET or DISCO_TABLE'
        console.error(error)
        response.Status = 'FAILED'
        response.Reason = error
        await sendResponse(event, response)
        return
      }

      // Initialize AWS clients
      const cfnClient = new CloudFormationClient({})
      const dynamoClient = new DynamoDBClient({})
      const s3Client = new S3Client({})

      // Get all stack resources
      const describeCommand = new DescribeStackResourcesCommand({
        StackName: stackName
      })
      const { StackResources } = await cfnClient.send(describeCommand)

      // Transform resources to simple format for pragma organizer
      const resources = StackResources.map(resource => ({
        LogicalResourceId: resource.LogicalResourceId,
        PhysicalResourceId: resource.PhysicalResourceId
      }))

      // Organize resources by pragma type
      const resourceMap = organizeByPragma(resources)

      console.log('Discovered resources:', JSON.stringify(resourceMap, null, 2))

      // Store in DynamoDB with stack ID as partition key
      const putItemCommand = new PutItemCommand({
        TableName: process.env.DISCO_TABLE,
        Item: {
          idx: { S: stackId },
          data: { S: JSON.stringify(resourceMap) }
        }
      })
      await dynamoClient.send(putItemCommand)

      // Store in S3 with stack ID in key path
      const putObjectCommand = new PutObjectCommand({
        Bucket: process.env.DISCO_BUCKET,
        Key: `${stackId}/resources.json`,
        Body: JSON.stringify(resourceMap, null, 2),
        ContentType: 'application/json'
      })
      await s3Client.send(putObjectCommand)

      console.log(`Successfully stored resource discovery data for stack ID: ${stackId}`)
    } else if (requestType === 'Delete') {
      // No-op for Delete events - disco-down handles cleanup
      console.log('Delete event received - no action required for disco-up')
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
