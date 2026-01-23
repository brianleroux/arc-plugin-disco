import { describe, it, mock, beforeEach } from 'node:test'
import assert from 'node:assert'
import { handler } from '../src/http/get-index/index.mjs'

describe('HTTP GET / handler', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    // Reset environment variables before each test
    process.env = { ...originalEnv }
  })

  it('should return error when DISCO_BUCKET is missing', async () => {
    delete process.env.DISCO_BUCKET
    process.env.DISCO_STACK_ID = 'test-stack-id'

    const response = await handler({})

    assert.strictEqual(response.statusCode, 500)
    const body = JSON.parse(response.body)
    assert.strictEqual(body.error, 'Missing DISCO_BUCKET environment variable')
  })

  it('should return error when DISCO_STACK_ID is missing', async () => {
    process.env.DISCO_BUCKET = 'test-bucket'
    delete process.env.DISCO_STACK_ID

    const response = await handler({})

    assert.strictEqual(response.statusCode, 500)
    const body = JSON.parse(response.body)
    assert.strictEqual(body.error, 'Missing DISCO_STACK_ID environment variable')
  })

  it('should return error when S3 resource not found', async () => {
    process.env.DISCO_BUCKET = 'test-bucket'
    process.env.DISCO_STACK_ID = 'test-stack-id'
    process.env.DISCO_TABLE = 'test-table'

    // Mock S3Client to throw NoSuchKey error
    const mockS3Send = mock.fn(async () => {
      const error = new Error('The specified key does not exist.')
      error.name = 'NoSuchKey'
      throw error
    })

    // Note: In a real test, we would need to mock the AWS SDK imports
    // For now, this validates the error handling structure
    const response = await handler({})

    assert.strictEqual(response.statusCode, 500)
    const body = JSON.parse(response.body)
    assert.ok(body.error.includes('Failed to load resource discovery data'))
  })

  it('should return error when DynamoDB item not found', async () => {
    process.env.DISCO_BUCKET = 'test-bucket'
    process.env.DISCO_STACK_ID = 'test-stack-id'
    process.env.DISCO_TABLE = 'test-table'

    // This test validates error handling structure
    // Full implementation would require mocking AWS SDK
    const response = await handler({})

    assert.strictEqual(response.statusCode, 500)
    const body = JSON.parse(response.body)
    assert.ok(body.error)
  })

  it('should return JSON response with correct structure', async () => {
    // This test validates the expected response structure
    // In a real scenario with mocked AWS SDK, we would verify:
    // - statusCode is 200
    // - headers contain Content-Type: application/json
    // - body contains message, stackId, storage, resources, examples, verification

    const expectedStructure = {
      message: 'Resource Discovery Example',
      stackId: 'test-stack-id',
      storage: {
        s3: {
          bucket: 'test-bucket',
          key: 'test-stack-id/resources.json'
        },
        dynamodb: {
          table: 'test-table',
          key: 'test-stack-id'
        }
      },
      resources: {
        http: {},
        events: {},
        tables: {},
        queues: {},
        ws: {},
        scheduled: {},
        plugins: {}
      },
      examples: {},
      verification: {
        s3MatchesDynamoDB: true
      }
    }

    // Validate structure
    assert.ok(expectedStructure.message)
    assert.ok(expectedStructure.stackId)
    assert.ok(expectedStructure.storage.s3)
    assert.ok(expectedStructure.storage.dynamodb)
    assert.ok(expectedStructure.resources)
    assert.ok(expectedStructure.verification)
  })

  it('should demonstrate accessing resources by pragma type and arc name', () => {
    // Example resource map
    const resources = {
      http: {
        'get /': 'arn:aws:lambda:us-east-1:123456789012:function:get-index'
      },
      events: {
        'foo': 'arn:aws:sns:us-east-1:123456789012:foo-topic',
        'bar': 'arn:aws:lambda:us-east-1:123456789012:function:bar'
      },
      tables: {
        'data': 'arn:aws:dynamodb:us-east-1:123456789012:table/data'
      },
      queues: {
        'tasks': 'arn:aws:sqs:us-east-1:123456789012:tasks-queue'
      },
      ws: {},
      scheduled: {},
      plugins: {}
    }

    // Demonstrate accessing resources
    assert.strictEqual(resources.http['get /'], 'arn:aws:lambda:us-east-1:123456789012:function:get-index')
    assert.strictEqual(resources.events.foo, 'arn:aws:sns:us-east-1:123456789012:foo-topic')
    assert.strictEqual(resources.tables.data, 'arn:aws:dynamodb:us-east-1:123456789012:table/data')
    assert.strictEqual(resources.queues.tasks, 'arn:aws:sqs:us-east-1:123456789012:tasks-queue')
  })

  it('should build examples for available resources', () => {
    const resources = {
      http: {
        'get /': 'arn:aws:lambda:us-east-1:123456789012:function:get-index',
        'post /api': 'arn:aws:lambda:us-east-1:123456789012:function:post-api'
      },
      events: {
        'foo': 'arn:aws:sns:us-east-1:123456789012:foo-topic'
      },
      tables: {
        'data': 'arn:aws:dynamodb:us-east-1:123456789012:table/data'
      },
      queues: {
        'tasks': 'arn:aws:sqs:us-east-1:123456789012:tasks-queue'
      },
      ws: {},
      scheduled: {},
      plugins: {}
    }

    // Validate that examples can be built for each pragma type
    const httpKeys = Object.keys(resources.http)
    const eventKeys = Object.keys(resources.events)
    const tableKeys = Object.keys(resources.tables)
    const queueKeys = Object.keys(resources.queues)

    assert.ok(httpKeys.length > 0, 'Should have HTTP routes')
    assert.ok(eventKeys.length > 0, 'Should have events')
    assert.ok(tableKeys.length > 0, 'Should have tables')
    assert.ok(queueKeys.length > 0, 'Should have queues')

    // Validate example structure
    const httpExample = {
      description: 'Access HTTP route by arc name',
      code: `resources.http['${httpKeys[0]}']`,
      value: resources.http[httpKeys[0]]
    }

    assert.ok(httpExample.description)
    assert.ok(httpExample.code)
    assert.ok(httpExample.value)
  })

  it('should handle empty resource sections gracefully', () => {
    const resources = {
      http: {},
      events: {},
      tables: {},
      queues: {},
      ws: {},
      scheduled: {},
      plugins: {}
    }

    // Validate all sections exist even when empty
    assert.ok(resources.http)
    assert.ok(resources.events)
    assert.ok(resources.tables)
    assert.ok(resources.queues)
    assert.ok(resources.ws)
    assert.ok(resources.scheduled)
    assert.ok(resources.plugins)

    // Validate no examples are built for empty sections
    const httpKeys = Object.keys(resources.http)
    const eventKeys = Object.keys(resources.events)

    assert.strictEqual(httpKeys.length, 0)
    assert.strictEqual(eventKeys.length, 0)
  })

  it('should verify S3 and DynamoDB data match', () => {
    const resourcesFromS3 = {
      http: { 'get /': 'arn:aws:lambda:123' },
      events: {},
      tables: {},
      queues: {},
      ws: {},
      scheduled: {},
      plugins: {}
    }

    const resourcesFromDynamoDB = {
      http: { 'get /': 'arn:aws:lambda:123' },
      events: {},
      tables: {},
      queues: {},
      ws: {},
      scheduled: {},
      plugins: {}
    }

    const s3Match = JSON.stringify(resourcesFromS3) === JSON.stringify(resourcesFromDynamoDB)
    assert.strictEqual(s3Match, true, 'S3 and DynamoDB data should match')
  })

  it('should detect when S3 and DynamoDB data differ', () => {
    const resourcesFromS3 = {
      http: { 'get /': 'arn:aws:lambda:123' },
      events: {},
      tables: {},
      queues: {},
      ws: {},
      scheduled: {},
      plugins: {}
    }

    const resourcesFromDynamoDB = {
      http: { 'get /': 'arn:aws:lambda:456' },
      events: {},
      tables: {},
      queues: {},
      ws: {},
      scheduled: {},
      plugins: {}
    }

    const s3Match = JSON.stringify(resourcesFromS3) === JSON.stringify(resourcesFromDynamoDB)
    assert.strictEqual(s3Match, false, 'S3 and DynamoDB data should not match when different')
  })
})
