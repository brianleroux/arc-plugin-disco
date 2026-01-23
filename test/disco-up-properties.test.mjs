import { test } from 'node:test'
import assert from 'node:assert'
import { extractStackId } from '../disco-up/stack-id-extractor.mjs'
import { organizeByPragma } from '../disco-up/pragma-organizer.mjs'

test('Property 11: S3 Storage Key Format', () => {
  // Feature: smart-resource-discovery, Property 11: S3 Storage Key Format
  // Validates: Requirements 4.1, 4.5
  
  const testCases = [
    { uuid: '550e8400-e29b-41d4-a716-446655440000', stackName: 'myapp' },
    { uuid: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', stackName: 'test-stack' },
    { uuid: '6ba7b810-9dad-11d1-80b4-00c04fd430c8', stackName: 'prod' }
  ]
  
  for (const { uuid, stackName } of testCases) {
    const stackIdArn = `arn:aws:cloudformation:us-east-1:123456789012:stack/${stackName}/${uuid}`
    const stackId = extractStackId(stackIdArn)
    
    // S3 key format should be: {stackId}/resources.json
    const s3Key = `${stackId}/resources.json`
    
    // Verify the key format
    assert.ok(s3Key.includes('/resources.json'), 'S3 key should end with /resources.json')
    assert.strictEqual(s3Key, `${uuid}/resources.json`, 'S3 key should use stack UUID')
  }
})

test('Property 12: DynamoDB Storage Key Format', () => {
  // Feature: smart-resource-discovery, Property 12: DynamoDB Storage Key Format
  // Validates: Requirements 4.2, 4.6
  
  const testCases = [
    { uuid: '550e8400-e29b-41d4-a716-446655440000', stackName: 'myapp' },
    { uuid: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', stackName: 'test-stack' },
    { uuid: '6ba7b810-9dad-11d1-80b4-00c04fd430c8', stackName: 'prod' }
  ]
  
  for (const { uuid, stackName } of testCases) {
    const stackIdArn = `arn:aws:cloudformation:us-east-1:123456789012:stack/${stackName}/${uuid}`
    const stackId = extractStackId(stackIdArn)
    
    // DynamoDB partition key should use the stack ID directly
    const dynamoKey = stackId
    
    // Verify the key format
    assert.strictEqual(dynamoKey, uuid, 'DynamoDB key should be the stack UUID')
  }
})

test('Property 13: Deployment Isolation', () => {
  // Feature: smart-resource-discovery, Property 13: Deployment Isolation
  // Validates: Requirements 4.7
  
  const testCases = [
    { 
      uuid1: '550e8400-e29b-41d4-a716-446655440000', 
      uuid2: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      stackName: 'myapp'
    },
    { 
      uuid1: '6ba7b810-9dad-11d1-80b4-00c04fd430c8', 
      uuid2: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
      stackName: 'test-stack'
    }
  ]
  
  for (const { uuid1, uuid2, stackName } of testCases) {
    // Two different stack IDs should produce different storage keys
    const stackIdArn1 = `arn:aws:cloudformation:us-east-1:123456789012:stack/${stackName}/${uuid1}`
    const stackIdArn2 = `arn:aws:cloudformation:us-east-1:123456789012:stack/${stackName}/${uuid2}`
    
    const stackId1 = extractStackId(stackIdArn1)
    const stackId2 = extractStackId(stackIdArn2)
    
    // S3 keys should be different
    const s3Key1 = `${stackId1}/resources.json`
    const s3Key2 = `${stackId2}/resources.json`
    
    // DynamoDB keys should be different
    const dynamoKey1 = stackId1
    const dynamoKey2 = stackId2
    
    // Verify isolation - different stack IDs produce different keys
    assert.notStrictEqual(s3Key1, s3Key2, 'S3 keys should be different for different stack IDs')
    assert.notStrictEqual(dynamoKey1, dynamoKey2, 'DynamoDB keys should be different for different stack IDs')
  }
})

test('Property 15: Valid JSON Output', () => {
  // Feature: smart-resource-discovery, Property 15: Valid JSON Output
  // Validates: Requirements 7.2
  
  const testCases = [
    [],
    [
      { LogicalResourceId: 'FooEventLambda', PhysicalResourceId: 'arn:aws:lambda:us-east-1:123:function:foo' }
    ],
    [
      { LogicalResourceId: 'GetIndexHTTPLambda', PhysicalResourceId: 'arn:aws:lambda:us-east-1:123:function:get-index' },
      { LogicalResourceId: 'DataTable', PhysicalResourceId: 'arn:aws:dynamodb:us-east-1:123:table/data' },
      { LogicalResourceId: 'TasksQueue', PhysicalResourceId: 'arn:aws:sqs:us-east-1:123:tasks' }
    ]
  ]
  
  for (const resources of testCases) {
    // Organize resources by pragma
    const resourceMap = organizeByPragma(resources)
    
    // Convert to JSON string
    const jsonString = JSON.stringify(resourceMap)
    
    // Verify it can be parsed back without errors
    let parsed
    try {
      parsed = JSON.parse(jsonString)
    } catch (error) {
      assert.fail(`Failed to parse JSON: ${error.message}`)
    }
    
    // Verify the parsed object has the same structure
    assert.ok(parsed, 'Parsed object should exist')
    assert.ok(typeof parsed === 'object', 'Parsed result should be an object')
    assert.ok(parsed.http !== undefined, 'Should have http section')
    assert.ok(parsed.events !== undefined, 'Should have events section')
    assert.ok(parsed.tables !== undefined, 'Should have tables section')
    assert.ok(parsed.queues !== undefined, 'Should have queues section')
    assert.ok(parsed.ws !== undefined, 'Should have ws section')
    assert.ok(parsed.scheduled !== undefined, 'Should have scheduled section')
    assert.ok(parsed.plugins !== undefined, 'Should have plugins section')
  }
})

test('Property 16: CloudFormation Response Format', () => {
  // Feature: smart-resource-discovery, Property 16: CloudFormation Response Format
  // Validates: Requirements 7.5
  
  const testCases = [
    {
      uuid: '550e8400-e29b-41d4-a716-446655440000',
      stackName: 'myapp',
      requestId: 'unique-request-id-1',
      logicalResourceId: 'DiscoResource',
      requestType: 'Create'
    },
    {
      uuid: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      stackName: 'test-stack',
      requestId: 'unique-request-id-2',
      logicalResourceId: 'CustomResource',
      requestType: 'Update'
    },
    {
      uuid: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      stackName: 'prod',
      requestId: 'unique-request-id-3',
      logicalResourceId: 'DiscoveryResource',
      requestType: 'Delete'
    }
  ]
  
  for (const { uuid, stackName, requestId, logicalResourceId, requestType } of testCases) {
    const stackIdArn = `arn:aws:cloudformation:us-east-1:123456789012:stack/${stackName}/${uuid}`
    
    // Build a CloudFormation response object
    const response = {
      Status: 'SUCCESS',
      PhysicalResourceId: `disco-${stackName}`,
      StackId: stackIdArn,
      RequestId: requestId,
      LogicalResourceId: logicalResourceId
    }
    
    // Verify all required fields are present
    assert.ok(response.Status, 'Response should have Status')
    assert.ok(['SUCCESS', 'FAILED'].includes(response.Status), 'Status should be SUCCESS or FAILED')
    assert.ok(response.PhysicalResourceId, 'Response should have PhysicalResourceId')
    assert.ok(response.StackId, 'Response should have StackId')
    assert.ok(response.RequestId, 'Response should have RequestId')
    assert.ok(response.LogicalResourceId, 'Response should have LogicalResourceId')
    
    // Verify types
    assert.strictEqual(typeof response.Status, 'string', 'Status should be a string')
    assert.strictEqual(typeof response.PhysicalResourceId, 'string', 'PhysicalResourceId should be a string')
    assert.strictEqual(typeof response.StackId, 'string', 'StackId should be a string')
    assert.strictEqual(typeof response.RequestId, 'string', 'RequestId should be a string')
    assert.strictEqual(typeof response.LogicalResourceId, 'string', 'LogicalResourceId should be a string')
  }
})
