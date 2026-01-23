import { loadResourcesFromS3, loadResourcesFromDynamoDB } from '../../shared/resource-loader.mjs'

/**
 * Example HTTP handler demonstrating resource discovery usage
 * 
 * This handler shows how to:
 * - Load discovered resources from S3
 * - Load discovered resources from DynamoDB
 * - Access resources by pragma type and arc name
 * - Handle errors gracefully
 */
export async function handler(event) {
  try {
    // Check for required environment variables
    if (!process.env.DISCO_BUCKET) {
      return errorResponse(500, 'Missing DISCO_BUCKET environment variable')
    }
    
    if (!process.env.DISCO_STACK_ID) {
      return errorResponse(500, 'Missing DISCO_STACK_ID environment variable')
    }
    
    // Load resources from both S3 and DynamoDB to demonstrate both methods
    const resourcesFromS3 = await loadResourcesFromS3()
    const resourcesFromDynamoDB = await loadResourcesFromDynamoDB()
    
    // Example: Access specific resources by pragma type and arc name
    const examples = buildResourceExamples(resourcesFromS3)
    
    // Return JSON response with discovered resources
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Resource Discovery Example',
        stackId: process.env.DISCO_STACK_ID,
        storage: {
          s3: {
            bucket: process.env.DISCO_BUCKET,
            key: `${process.env.DISCO_STACK_ID}/resources.json`
          },
          dynamodb: {
            table: process.env.DISCO_TABLE,
            key: process.env.DISCO_STACK_ID
          }
        },
        resources: resourcesFromS3,
        examples: examples,
        verification: {
          s3MatchesDynamoDB: JSON.stringify(resourcesFromS3) === JSON.stringify(resourcesFromDynamoDB)
        }
      }, null, 2)
    }
  } catch (error) {
    console.error('Failed to load resources:', error)
    return errorResponse(500, 'Failed to load resource discovery data', error.message)
  }
}

/**
 * Build examples of how to access specific resources
 * @param {Object} resources - Hierarchical resource map
 * @returns {Object} Example resource access patterns
 */
function buildResourceExamples(resources) {
  const examples = {}
  
  // Example: Accessing HTTP routes
  if (resources.http && Object.keys(resources.http).length > 0) {
    const firstHttpRoute = Object.keys(resources.http)[0]
    examples.httpRoute = {
      description: 'Access HTTP route by arc name',
      code: `resources.http['${firstHttpRoute}']`,
      value: resources.http[firstHttpRoute]
    }
  }
  
  // Example: Accessing event topics
  if (resources.events && Object.keys(resources.events).length > 0) {
    const firstEvent = Object.keys(resources.events)[0]
    examples.eventTopic = {
      description: 'Access event topic by arc name',
      code: `resources.events['${firstEvent}']`,
      value: resources.events[firstEvent]
    }
  }
  
  // Example: Accessing tables
  if (resources.tables && Object.keys(resources.tables).length > 0) {
    const firstTable = Object.keys(resources.tables)[0]
    examples.table = {
      description: 'Access table by arc name',
      code: `resources.tables['${firstTable}']`,
      value: resources.tables[firstTable]
    }
  }
  
  // Example: Accessing queues
  if (resources.queues && Object.keys(resources.queues).length > 0) {
    const firstQueue = Object.keys(resources.queues)[0]
    examples.queue = {
      description: 'Access queue by arc name',
      code: `resources.queues['${firstQueue}']`,
      value: resources.queues[firstQueue]
    }
  }
  
  return examples
}

/**
 * Create an error response
 * @param {number} statusCode - HTTP status code
 * @param {string} error - Error message
 * @param {string} [details] - Additional error details
 * @returns {Object} HTTP response object
 */
function errorResponse(statusCode, error, details) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      error,
      ...(details && { details })
    })
  }
}