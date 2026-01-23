import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb'

/**
 * Load discovered resources from S3
 * 
 * Retrieves the hierarchical resource map organized by pragma type from S3.
 * Uses DISCO_BUCKET and DISCO_STACK_ID environment variables.
 * 
 * @returns {Promise<Object>} Hierarchical resource map organized by pragma type
 * @throws {Error} If environment variables are missing or S3 operation fails
 * 
 * @example
 * const resources = await loadResourcesFromS3()
 * const fooTopicArn = resources.events.foo
 * const dataTableArn = resources.tables.data
 */
export async function loadResourcesFromS3() {
  // Validate environment variables
  if (!process.env.DISCO_BUCKET) {
    const error = 'Missing DISCO_BUCKET environment variable'
    console.error(error)
    throw new Error(error)
  }
  
  if (!process.env.DISCO_STACK_ID) {
    const error = 'Missing DISCO_STACK_ID environment variable'
    console.error(error)
    throw new Error(error)
  }
  
  try {
    const s3Client = new S3Client({})
    const stackId = process.env.DISCO_STACK_ID
    const bucket = process.env.DISCO_BUCKET
    const key = `${stackId}/resources.json`
    
    console.log(`Loading resources from S3: s3://${bucket}/${key}`)
    
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key
    })
    
    const response = await s3Client.send(command)
    const body = await response.Body.transformToString()
    const resources = JSON.parse(body)
    
    console.log('Successfully loaded resources from S3')
    return resources
  } catch (error) {
    if (error.name === 'NoSuchKey') {
      const message = `Resource discovery data not found in S3 for stack ID: ${process.env.DISCO_STACK_ID}`
      console.error(message)
      throw new Error(message)
    }
    
    console.error('Failed to load resources from S3:', error)
    throw new Error(`S3 load failed: ${error.message}`)
  }
}

/**
 * Load discovered resources from DynamoDB
 * 
 * Retrieves the hierarchical resource map organized by pragma type from DynamoDB.
 * Uses DISCO_TABLE and DISCO_STACK_ID environment variables.
 * 
 * @returns {Promise<Object>} Hierarchical resource map organized by pragma type
 * @throws {Error} If environment variables are missing or DynamoDB operation fails
 * 
 * @example
 * const resources = await loadResourcesFromDynamoDB()
 * const getRootHandlerArn = resources.http['get /']
 * const tasksQueueArn = resources.queues.tasks
 */
export async function loadResourcesFromDynamoDB() {
  // Validate environment variables
  if (!process.env.DISCO_TABLE) {
    const error = 'Missing DISCO_TABLE environment variable'
    console.error(error)
    throw new Error(error)
  }
  
  if (!process.env.DISCO_STACK_ID) {
    const error = 'Missing DISCO_STACK_ID environment variable'
    console.error(error)
    throw new Error(error)
  }
  
  try {
    const dynamoClient = new DynamoDBClient({})
    const stackId = process.env.DISCO_STACK_ID
    const tableName = process.env.DISCO_TABLE
    
    console.log(`Loading resources from DynamoDB: table=${tableName}, key=${stackId}`)
    
    const command = new GetItemCommand({
      TableName: tableName,
      Key: {
        idx: { S: stackId }
      }
    })
    
    const response = await dynamoClient.send(command)
    
    if (!response.Item || !response.Item.data) {
      const message = `Resource discovery data not found in DynamoDB for stack ID: ${stackId}`
      console.error(message)
      throw new Error(message)
    }
    
    const resources = JSON.parse(response.Item.data.S)
    
    console.log('Successfully loaded resources from DynamoDB')
    return resources
  } catch (error) {
    console.error('Failed to load resources from DynamoDB:', error)
    throw new Error(`DynamoDB load failed: ${error.message}`)
  }
}
