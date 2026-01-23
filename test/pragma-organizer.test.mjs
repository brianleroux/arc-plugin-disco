import { describe, it } from 'node:test'
import assert from 'node:assert'
import { organizeByPragma } from '../disco-up/pragma-organizer.mjs'

describe('Pragma Organizer', () => {
  
  describe('Property 1: Resource Map Structure Completeness', () => {
    it('should always include all seven pragma type sections', () => {
      // **Property 1: Resource Map Structure Completeness**
      // **Validates: Requirements 1.1, 1.2, 1.3, 1.4**
      
      const testCases = [
        [],
        [{ LogicalResourceId: 'FooEventLambda', PhysicalResourceId: 'arn:aws:lambda:us-east-1:123:function:foo' }],
        [
          { LogicalResourceId: 'GetIndexHTTPLambda', PhysicalResourceId: 'arn:aws:lambda:us-east-1:123:function:get-index' },
          { LogicalResourceId: 'DataTable', PhysicalResourceId: 'arn:aws:dynamodb:us-east-1:123:table/data' }
        ]
      ]
      
      for (const resources of testCases) {
        const organized = organizeByPragma(resources)
        
        const requiredSections = ['http', 'events', 'tables', 'queues', 'ws', 'scheduled', 'plugins']
        for (const section of requiredSections) {
          assert.ok(organized.hasOwnProperty(section), `Missing section: ${section}`)
          assert.ok(typeof organized[section] === 'object', `Section ${section} is not an object`)
          assert.ok(organized[section] !== null, `Section ${section} is null`)
        }
      }
    })
    
    it('should include empty objects for sections with no resources', () => {
      // **Property 1: Resource Map Structure Completeness**
      // **Validates: Requirements 1.1, 1.2, 1.3, 1.4**
      
      const resources = [
        { LogicalResourceId: 'FooEventLambda', PhysicalResourceId: 'arn:aws:lambda:us-east-1:123:function:foo' },
        { LogicalResourceId: 'BarTopic', PhysicalResourceId: 'arn:aws:sns:us-east-1:123:bar' },
        { LogicalResourceId: 'DataTable', PhysicalResourceId: 'arn:aws:dynamodb:us-east-1:123:table/data' }
      ]
      
      const organized = organizeByPragma(resources)
      
      // These sections should be empty for the given test resources
      const emptySections = ['queues', 'ws', 'scheduled']
      for (const section of emptySections) {
        assert.ok(organized.hasOwnProperty(section), `Missing section: ${section}`)
        assert.ok(typeof organized[section] === 'object', `Section ${section} is not an object`)
        assert.strictEqual(Object.keys(organized[section]).length, 0, `Section ${section} should be empty`)
      }
    })
  })
  
  describe('Property 2: Arc Names as Keys Within Pragma Sections', () => {
    it('should use arc names as keys, not CloudFormation logical IDs', () => {
      // **Property 2: Arc Names as Keys Within Pragma Sections**
      // **Validates: Requirements 1.5**
      
      const testCases = [
        { 
          logicalId: 'FooEventLambda', 
          physicalId: 'arn:aws:lambda:us-east-1:123:function:foo',
          expectedKey: 'foo',
          section: 'events'
        },
        { 
          logicalId: 'BarTopic', 
          physicalId: 'arn:aws:sns:us-east-1:123:bar',
          expectedKey: 'bar',
          section: 'events'
        },
        { 
          logicalId: 'DataTable', 
          physicalId: 'arn:aws:dynamodb:us-east-1:123:table/data',
          expectedKey: 'data',
          section: 'tables'
        }
      ]
      
      for (const { logicalId, physicalId, expectedKey, section } of testCases) {
        const resources = [{ LogicalResourceId: logicalId, PhysicalResourceId: physicalId }]
        const organized = organizeByPragma(resources)
        
        // The key should be the lowercase arc name, not the original logical ID
        assert.ok(organized[section].hasOwnProperty(expectedKey), `Should have key "${expectedKey}" in ${section}`)
        assert.ok(!organized[section].hasOwnProperty(logicalId), `Should not have logical ID "${logicalId}" as key`)
      }
    })
    
    it('should use arc names for HTTP routes in correct format', () => {
      // **Property 2: Arc Names as Keys Within Pragma Sections**
      // **Validates: Requirements 1.5**
      
      const testCases = [
        { 
          logicalId: 'GetIndexHTTPLambda', 
          physicalId: 'arn:aws:lambda:us-east-1:123:function:get-index',
          expectedKey: 'get /'
        },
        { 
          logicalId: 'GetApiUsersHTTPLambda', 
          physicalId: 'arn:aws:lambda:us-east-1:123:function:get-api-users',
          expectedKey: 'get /api/users'
        },
        { 
          logicalId: 'PostApiUsersHTTPLambda', 
          physicalId: 'arn:aws:lambda:us-east-1:123:function:post-api-users',
          expectedKey: 'post /api/users'
        }
      ]
      
      for (const { logicalId, physicalId, expectedKey } of testCases) {
        const resources = [{ LogicalResourceId: logicalId, PhysicalResourceId: physicalId }]
        const organized = organizeByPragma(resources)
        
        // HTTP section should have a key in the correct format
        assert.ok(organized.http.hasOwnProperty(expectedKey), `Should have key "${expectedKey}" in http section`)
      }
    })
  })
  
  describe('Unit Tests: Pragma Organizer', () => {
    it('should include all pragma sections even when empty', () => {
      // Test with empty resources array
      const organized = organizeByPragma([])
      
      const requiredSections = ['http', 'events', 'tables', 'queues', 'ws', 'scheduled', 'plugins']
      for (const section of requiredSections) {
        assert.ok(organized.hasOwnProperty(section), `Missing section: ${section}`)
        assert.strictEqual(typeof organized[section], 'object', `Section ${section} is not an object`)
        assert.strictEqual(Object.keys(organized[section]).length, 0, `Section ${section} should be empty`)
      }
    })
    
    it('should place resources in correct pragma sections', () => {
      const resources = [
        { LogicalResourceId: 'FooEventLambda', PhysicalResourceId: 'arn:aws:lambda:us-east-1:123:function:foo' },
        { LogicalResourceId: 'GetIndexHTTPLambda', PhysicalResourceId: 'arn:aws:lambda:us-east-1:123:function:get-index' },
        { LogicalResourceId: 'DataTable', PhysicalResourceId: 'arn:aws:dynamodb:us-east-1:123:table/data' },
        { LogicalResourceId: 'TasksQueue', PhysicalResourceId: 'arn:aws:sqs:us-east-1:123:tasks' },
        { LogicalResourceId: 'ChatWebsocket', PhysicalResourceId: 'arn:aws:apigateway:us-east-1:123:chat' },
        { LogicalResourceId: 'DailyScheduled', PhysicalResourceId: 'arn:aws:lambda:us-east-1:123:function:daily' },
        { LogicalResourceId: 'CustomResource', PhysicalResourceId: 'arn:aws:s3:::custom' },
      ]
      
      const organized = organizeByPragma(resources)
      
      // Check events section
      assert.ok(organized.events.hasOwnProperty('foo'), 'Missing foo in events')
      assert.strictEqual(organized.events.foo, 'arn:aws:lambda:us-east-1:123:function:foo')
      
      // Check http section
      assert.ok(organized.http.hasOwnProperty('get /'), 'Missing get / in http')
      assert.strictEqual(organized.http['get /'], 'arn:aws:lambda:us-east-1:123:function:get-index')
      
      // Check tables section
      assert.ok(organized.tables.hasOwnProperty('data'), 'Missing data in tables')
      assert.strictEqual(organized.tables.data, 'arn:aws:dynamodb:us-east-1:123:table/data')
      
      // Check queues section
      assert.ok(organized.queues.hasOwnProperty('tasks'), 'Missing tasks in queues')
      assert.strictEqual(organized.queues.tasks, 'arn:aws:sqs:us-east-1:123:tasks')
      
      // Check ws section
      assert.ok(organized.ws.hasOwnProperty('chat'), 'Missing chat in ws')
      assert.strictEqual(organized.ws.chat, 'arn:aws:apigateway:us-east-1:123:chat')
      
      // Check scheduled section
      assert.ok(organized.scheduled.hasOwnProperty('daily'), 'Missing daily in scheduled')
      assert.strictEqual(organized.scheduled.daily, 'arn:aws:lambda:us-east-1:123:function:daily')
      
      // Check plugins section
      assert.ok(organized.plugins.hasOwnProperty('CustomResource'), 'Missing CustomResource in plugins')
      assert.strictEqual(organized.plugins.CustomResource, 'arn:aws:s3:::custom')
    })
    
    it('should handle multiple resources in the same section', () => {
      const resources = [
        { LogicalResourceId: 'FooEventLambda', PhysicalResourceId: 'arn:aws:lambda:us-east-1:123:function:foo' },
        { LogicalResourceId: 'BarEventLambda', PhysicalResourceId: 'arn:aws:lambda:us-east-1:123:function:bar' },
        { LogicalResourceId: 'BazTopic', PhysicalResourceId: 'arn:aws:sns:us-east-1:123:baz' },
      ]
      
      const organized = organizeByPragma(resources)
      
      assert.strictEqual(Object.keys(organized.events).length, 3, 'Should have 3 events')
      assert.ok(organized.events.hasOwnProperty('foo'))
      assert.ok(organized.events.hasOwnProperty('bar'))
      assert.ok(organized.events.hasOwnProperty('baz'))
    })
    
    it('should handle empty resources array', () => {
      const organized = organizeByPragma([])
      
      const requiredSections = ['http', 'events', 'tables', 'queues', 'ws', 'scheduled', 'plugins']
      for (const section of requiredSections) {
        assert.ok(organized.hasOwnProperty(section))
        assert.strictEqual(Object.keys(organized[section]).length, 0)
      }
    })
    
    it('should use arc names as keys, not logical IDs', () => {
      const resources = [
        { LogicalResourceId: 'FooEventLambda', PhysicalResourceId: 'arn:aws:lambda:us-east-1:123:function:foo' },
        { LogicalResourceId: 'GetApiUsersHTTPLambda', PhysicalResourceId: 'arn:aws:lambda:us-east-1:123:function:get-api-users' },
      ]
      
      const organized = organizeByPragma(resources)
      
      // Should use arc names, not logical IDs
      assert.ok(organized.events.hasOwnProperty('foo'), 'Should have "foo" key')
      assert.ok(!organized.events.hasOwnProperty('FooEventLambda'), 'Should not have "FooEventLambda" key')
      
      assert.ok(organized.http.hasOwnProperty('get /api/users'), 'Should have "get /api/users" key')
      assert.ok(!organized.http.hasOwnProperty('GetApiUsersHTTPLambda'), 'Should not have "GetApiUsersHTTPLambda" key')
    })
  })
})
