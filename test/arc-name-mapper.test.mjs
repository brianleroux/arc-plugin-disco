import { describe, it } from 'node:test'
import assert from 'node:assert'
import { deriveArcNameAndPragma } from '../disco-up/arc-name-mapper.mjs'

describe('Arc Name Mapper', () => {
  
  describe('Property 3: Event Resource Pattern Matching', () => {
    it('should derive lowercase arc name and events pragma for EventLambda pattern', () => {
      // **Property 3: Event Resource Pattern Matching**
      // **Validates: Requirements 2.1, 3.1, 3.5**
      
      // Test various EventLambda patterns
      const testCases = [
        { logicalId: 'FooEventLambda', expectedArcName: 'foo', expectedPragma: 'events' },
        { logicalId: 'BarEventLambda', expectedArcName: 'bar', expectedPragma: 'events' },
        { logicalId: 'BazEventLambda', expectedArcName: 'baz', expectedPragma: 'events' },
        { logicalId: 'MyEventEventLambda', expectedArcName: 'myevent', expectedPragma: 'events' },
        { logicalId: 'TestEvent123EventLambda', expectedArcName: 'testevent123', expectedPragma: 'events' },
        { logicalId: 'AEventLambda', expectedArcName: 'a', expectedPragma: 'events' },
        { logicalId: 'UserCreatedEventLambda', expectedArcName: 'usercreated', expectedPragma: 'events' },
      ]
      
      for (const testCase of testCases) {
        const { arcName, pragmaType } = deriveArcNameAndPragma(testCase.logicalId)
        
        assert.strictEqual(
          arcName,
          testCase.expectedArcName,
          `Expected arc name "${testCase.expectedArcName}" for "${testCase.logicalId}", but got "${arcName}"`
        )
        assert.strictEqual(
          pragmaType,
          testCase.expectedPragma,
          `Expected pragma type "${testCase.expectedPragma}" for "${testCase.logicalId}", but got "${pragmaType}"`
        )
      }
    })
    
    it('should derive lowercase arc name and events pragma for Topic pattern', () => {
      // **Property 3: Event Resource Pattern Matching**
      // **Validates: Requirements 2.1, 3.1, 3.5**
      
      // Test various Topic patterns
      const testCases = [
        { logicalId: 'FooTopic', expectedArcName: 'foo', expectedPragma: 'events' },
        { logicalId: 'BarTopic', expectedArcName: 'bar', expectedPragma: 'events' },
        { logicalId: 'BazTopic', expectedArcName: 'baz', expectedPragma: 'events' },
        { logicalId: 'MyEventTopic', expectedArcName: 'myevent', expectedPragma: 'events' },
        { logicalId: 'Test123Topic', expectedArcName: 'test123', expectedPragma: 'events' },
        { logicalId: 'ATopic', expectedArcName: 'a', expectedPragma: 'events' },
        { logicalId: 'UserCreatedTopic', expectedArcName: 'usercreated', expectedPragma: 'events' },
      ]
      
      for (const testCase of testCases) {
        const { arcName, pragmaType } = deriveArcNameAndPragma(testCase.logicalId)
        
        assert.strictEqual(
          arcName,
          testCase.expectedArcName,
          `Expected arc name "${testCase.expectedArcName}" for "${testCase.logicalId}", but got "${arcName}"`
        )
        assert.strictEqual(
          pragmaType,
          testCase.expectedPragma,
          `Expected pragma type "${testCase.expectedPragma}" for "${testCase.logicalId}", but got "${pragmaType}"`
        )
      }
    })
    
    it('should handle various casing patterns for event resources', () => {
      // Test that uppercase, mixed case, and numbers are all lowercased
      const testCases = [
        { logicalId: 'FOOEventLambda', expectedArcName: 'foo' },
        { logicalId: 'FooBarEventLambda', expectedArcName: 'foobar' },
        { logicalId: 'Foo123EventLambda', expectedArcName: 'foo123' },
        { logicalId: 'FOO123Topic', expectedArcName: 'foo123' },
        { logicalId: 'FooBarBazTopic', expectedArcName: 'foobarbaz' },
      ]
      
      for (const testCase of testCases) {
        const { arcName, pragmaType } = deriveArcNameAndPragma(testCase.logicalId)
        
        assert.strictEqual(arcName, testCase.expectedArcName)
        assert.strictEqual(pragmaType, 'events')
      }
    })
  })

  describe('Property 4: HTTP Resource Pattern Matching and Formatting', () => {
    it('should convert HTTP routes with lowercase method and proper path formatting', () => {
      // **Property 4: HTTP Resource Pattern Matching and Formatting**
      // **Validates: Requirements 2.2, 3.2, 6.1, 6.2, 6.4**
      
      const testCases = [
        // Root path
        { logicalId: 'GetIndexHTTPLambda', expectedArcName: 'get /', expectedPragma: 'http' },
        { logicalId: 'PostIndexHTTPLambda', expectedArcName: 'post /', expectedPragma: 'http' },
        { logicalId: 'PutIndexHTTPLambda', expectedArcName: 'put /', expectedPragma: 'http' },
        { logicalId: 'DeleteIndexHTTPLambda', expectedArcName: 'delete /', expectedPragma: 'http' },
        { logicalId: 'PatchIndexHTTPLambda', expectedArcName: 'patch /', expectedPragma: 'http' },
        { logicalId: 'HeadIndexHTTPLambda', expectedArcName: 'head /', expectedPragma: 'http' },
        { logicalId: 'OptionsIndexHTTPLambda', expectedArcName: 'options /', expectedPragma: 'http' },
        
        // Single segment paths
        { logicalId: 'GetApiHTTPLambda', expectedArcName: 'get /api', expectedPragma: 'http' },
        { logicalId: 'PostUsersHTTPLambda', expectedArcName: 'post /users', expectedPragma: 'http' },
        { logicalId: 'GetProductsHTTPLambda', expectedArcName: 'get /products', expectedPragma: 'http' },
        
        // Multi-segment paths
        { logicalId: 'GetApiUsersHTTPLambda', expectedArcName: 'get /api/users', expectedPragma: 'http' },
        { logicalId: 'PostApiUsersHTTPLambda', expectedArcName: 'post /api/users', expectedPragma: 'http' },
        { logicalId: 'GetApiUsersProfileHTTPLambda', expectedArcName: 'get /api/users/profile', expectedPragma: 'http' },
        { logicalId: 'PutApiProductsUpdateHTTPLambda', expectedArcName: 'put /api/products/update', expectedPragma: 'http' },
        { logicalId: 'DeleteApiUsersDeleteHTTPLambda', expectedArcName: 'delete /api/users/delete', expectedPragma: 'http' },
        
        // Complex paths
        { logicalId: 'GetApiV1UsersProfileHTTPLambda', expectedArcName: 'get /api/v1/users/profile', expectedPragma: 'http' },
        { logicalId: 'PostApiV2ProductsCreateHTTPLambda', expectedArcName: 'post /api/v2/products/create', expectedPragma: 'http' },
      ]
      
      for (const testCase of testCases) {
        const { arcName, pragmaType } = deriveArcNameAndPragma(testCase.logicalId)
        
        assert.strictEqual(
          arcName,
          testCase.expectedArcName,
          `Expected arc name "${testCase.expectedArcName}" for "${testCase.logicalId}", but got "${arcName}"`
        )
        assert.strictEqual(
          pragmaType,
          testCase.expectedPragma,
          `Expected pragma type "${testCase.expectedPragma}" for "${testCase.logicalId}", but got "${pragmaType}"`
        )
      }
    })
    
    it('should handle all HTTP methods consistently', () => {
      // Test that all HTTP methods are converted to lowercase
      const methods = ['Get', 'Post', 'Put', 'Patch', 'Delete', 'Head', 'Options']
      
      for (const method of methods) {
        const logicalId = `${method}ApiUsersHTTPLambda`
        const { arcName, pragmaType } = deriveArcNameAndPragma(logicalId)
        
        assert.ok(
          arcName.startsWith(method.toLowerCase()),
          `Expected arc name to start with "${method.toLowerCase()}" for "${logicalId}", but got "${arcName}"`
        )
        assert.strictEqual(pragmaType, 'http')
      }
    })
    
    it('should format root path as "method /"', () => {
      // **Validates: Requirement 6.3**
      const rootPathCases = [
        'GetIndexHTTPLambda',
        'PostIndexHTTPLambda',
        'GetHTTPLambda', // Empty path part
      ]
      
      for (const logicalId of rootPathCases) {
        const { arcName } = deriveArcNameAndPragma(logicalId)
        
        assert.ok(
          arcName.endsWith(' /'),
          `Expected arc name to end with " /" for root path "${logicalId}", but got "${arcName}"`
        )
      }
    })
    
    it('should format multi-segment paths with slashes', () => {
      // **Validates: Requirement 6.4**
      const testCases = [
        { logicalId: 'GetApiUsersHTTPLambda', expectedSegments: ['api', 'users'] },
        { logicalId: 'PostApiV1ProductsHTTPLambda', expectedSegments: ['api', 'v1', 'products'] },
        { logicalId: 'GetApiV2UsersProfileSettingsHTTPLambda', expectedSegments: ['api', 'v2', 'users', 'profile', 'settings'] },
      ]
      
      for (const testCase of testCases) {
        const { arcName } = deriveArcNameAndPragma(testCase.logicalId)
        
        // Extract path part (after method and space)
        const pathPart = arcName.split(' ')[1]
        
        // Check that all expected segments are present
        for (const segment of testCase.expectedSegments) {
          assert.ok(
            pathPart.includes(segment),
            `Expected path "${pathPart}" to contain segment "${segment}" for "${testCase.logicalId}"`
          )
        }
        
        // Check that segments are separated by slashes
        const segmentCount = testCase.expectedSegments.length
        const slashCount = (pathPart.match(/\//g) || []).length
        assert.strictEqual(
          slashCount,
          segmentCount,
          `Expected ${segmentCount} slashes in path "${pathPart}" for "${testCase.logicalId}", but got ${slashCount}`
        )
      }
    })
  })

  describe('Property 5: Table Resource Pattern Matching', () => {
    it('should derive lowercase arc name and tables pragma for Table pattern', () => {
      // **Property 5: Table Resource Pattern Matching**
      // **Validates: Requirements 2.3, 3.3**
      
      const testCases = [
        { logicalId: 'DataTable', expectedArcName: 'data', expectedPragma: 'tables' },
        { logicalId: 'UsersTable', expectedArcName: 'users', expectedPragma: 'tables' },
        { logicalId: 'ProductsTable', expectedArcName: 'products', expectedPragma: 'tables' },
        { logicalId: 'OrdersTable', expectedArcName: 'orders', expectedPragma: 'tables' },
        { logicalId: 'MyDataTable', expectedArcName: 'mydata', expectedPragma: 'tables' },
        { logicalId: 'Test123Table', expectedArcName: 'test123', expectedPragma: 'tables' },
        { logicalId: 'ATable', expectedArcName: 'a', expectedPragma: 'tables' },
      ]
      
      for (const testCase of testCases) {
        const { arcName, pragmaType } = deriveArcNameAndPragma(testCase.logicalId)
        
        assert.strictEqual(
          arcName,
          testCase.expectedArcName,
          `Expected arc name "${testCase.expectedArcName}" for "${testCase.logicalId}", but got "${arcName}"`
        )
        assert.strictEqual(
          pragmaType,
          testCase.expectedPragma,
          `Expected pragma type "${testCase.expectedPragma}" for "${testCase.logicalId}", but got "${pragmaType}"`
        )
      }
    })
  })
  
  describe('Property 6: Queue Resource Pattern Matching', () => {
    it('should derive lowercase arc name and queues pragma for Queue pattern', () => {
      // **Property 6: Queue Resource Pattern Matching**
      // **Validates: Requirements 2.4, 3.4**
      
      const testCases = [
        { logicalId: 'TasksQueue', expectedArcName: 'tasks', expectedPragma: 'queues' },
        { logicalId: 'JobsQueue', expectedArcName: 'jobs', expectedPragma: 'queues' },
        { logicalId: 'MessagesQueue', expectedArcName: 'messages', expectedPragma: 'queues' },
        { logicalId: 'EmailQueue', expectedArcName: 'email', expectedPragma: 'queues' },
        { logicalId: 'MyQueueQueue', expectedArcName: 'myqueue', expectedPragma: 'queues' },
        { logicalId: 'Test123Queue', expectedArcName: 'test123', expectedPragma: 'queues' },
        { logicalId: 'QQueue', expectedArcName: 'q', expectedPragma: 'queues' },
      ]
      
      for (const testCase of testCases) {
        const { arcName, pragmaType } = deriveArcNameAndPragma(testCase.logicalId)
        
        assert.strictEqual(
          arcName,
          testCase.expectedArcName,
          `Expected arc name "${testCase.expectedArcName}" for "${testCase.logicalId}", but got "${arcName}"`
        )
        assert.strictEqual(
          pragmaType,
          testCase.expectedPragma,
          `Expected pragma type "${testCase.expectedPragma}" for "${testCase.logicalId}", but got "${pragmaType}"`
        )
      }
    })
  })
  
  describe('Property 7: Websocket Resource Pattern Matching', () => {
    it('should derive lowercase arc name and ws pragma for Websocket pattern', () => {
      // **Property 7: Websocket Resource Pattern Matching**
      // **Validates: Requirements 2.5, 3.6**
      
      const testCases = [
        { logicalId: 'ChatWebsocket', expectedArcName: 'chat', expectedPragma: 'ws' },
        { logicalId: 'DefaultWebsocket', expectedArcName: 'default', expectedPragma: 'ws' },
        { logicalId: 'ConnectWebsocket', expectedArcName: 'connect', expectedPragma: 'ws' },
        { logicalId: 'DisconnectWebsocket', expectedArcName: 'disconnect', expectedPragma: 'ws' },
        { logicalId: 'MessageWebsocket', expectedArcName: 'message', expectedPragma: 'ws' },
        { logicalId: 'Test123Websocket', expectedArcName: 'test123', expectedPragma: 'ws' },
        { logicalId: 'WsWebsocket', expectedArcName: 'ws', expectedPragma: 'ws' },
      ]
      
      for (const testCase of testCases) {
        const { arcName, pragmaType } = deriveArcNameAndPragma(testCase.logicalId)
        
        assert.strictEqual(
          arcName,
          testCase.expectedArcName,
          `Expected arc name "${testCase.expectedArcName}" for "${testCase.logicalId}", but got "${arcName}"`
        )
        assert.strictEqual(
          pragmaType,
          testCase.expectedPragma,
          `Expected pragma type "${testCase.expectedPragma}" for "${testCase.logicalId}", but got "${pragmaType}"`
        )
      }
    })
  })
  
  describe('Property 8: Scheduled Resource Pattern Matching', () => {
    it('should derive lowercase arc name and scheduled pragma for Scheduled pattern', () => {
      // **Property 8: Scheduled Resource Pattern Matching**
      // **Validates: Requirements 2.6, 3.7**
      
      const testCases = [
        { logicalId: 'DailyScheduled', expectedArcName: 'daily', expectedPragma: 'scheduled' },
        { logicalId: 'HourlyScheduled', expectedArcName: 'hourly', expectedPragma: 'scheduled' },
        { logicalId: 'WeeklyScheduled', expectedArcName: 'weekly', expectedPragma: 'scheduled' },
        { logicalId: 'BackupScheduled', expectedArcName: 'backup', expectedPragma: 'scheduled' },
        { logicalId: 'CleanupScheduled', expectedArcName: 'cleanup', expectedPragma: 'scheduled' },
        { logicalId: 'Test123Scheduled', expectedArcName: 'test123', expectedPragma: 'scheduled' },
        { logicalId: 'SScheduled', expectedArcName: 's', expectedPragma: 'scheduled' },
      ]
      
      for (const testCase of testCases) {
        const { arcName, pragmaType } = deriveArcNameAndPragma(testCase.logicalId)
        
        assert.strictEqual(
          arcName,
          testCase.expectedArcName,
          `Expected arc name "${testCase.expectedArcName}" for "${testCase.logicalId}", but got "${arcName}"`
        )
        assert.strictEqual(
          pragmaType,
          testCase.expectedPragma,
          `Expected pragma type "${testCase.expectedPragma}" for "${testCase.logicalId}", but got "${pragmaType}"`
        )
      }
    })
  })

  describe('Property 9: Fallback to Plugins Section', () => {
    it('should place unrecognized resources in plugins section with original logical ID', () => {
      // **Property 9: Fallback to Plugins Section**
      // **Validates: Requirements 2.7**
      
      const testCases = [
        // Resources that don't match any known pattern
        { logicalId: 'CustomResource', expectedArcName: 'CustomResource', expectedPragma: 'plugins' },
        { logicalId: 'DiscoBucket', expectedArcName: 'DiscoBucket', expectedPragma: 'plugins' },
        { logicalId: 'DiscoStorage', expectedArcName: 'DiscoStorage', expectedPragma: 'plugins' },
        { logicalId: 'MyCustomLambda', expectedArcName: 'MyCustomLambda', expectedPragma: 'plugins' },
        { logicalId: 'SomeOtherResource', expectedArcName: 'SomeOtherResource', expectedPragma: 'plugins' },
        { logicalId: 'RandomThing', expectedArcName: 'RandomThing', expectedPragma: 'plugins' },
        
        // Resources with partial matches but not complete patterns
        { logicalId: 'EventLambdaButNotReally', expectedArcName: 'EventLambdaButNotReally', expectedPragma: 'plugins' },
        { logicalId: 'NotATableResource', expectedArcName: 'NotATableResource', expectedPragma: 'plugins' },
        { logicalId: 'QueueLike', expectedArcName: 'QueueLike', expectedPragma: 'plugins' },
        { logicalId: 'WebsocketIsh', expectedArcName: 'WebsocketIsh', expectedPragma: 'plugins' },
        { logicalId: 'ScheduledMaybe', expectedArcName: 'ScheduledMaybe', expectedPragma: 'plugins' },
        
        // Edge cases
        { logicalId: 'Event', expectedArcName: 'Event', expectedPragma: 'plugins' },
        { logicalId: 'HTTP', expectedArcName: 'HTTP', expectedPragma: 'plugins' },
        { logicalId: 'Lambda', expectedArcName: 'Lambda', expectedPragma: 'plugins' },
        { logicalId: '', expectedArcName: '', expectedPragma: 'plugins' },
        { logicalId: '123', expectedArcName: '123', expectedPragma: 'plugins' },
      ]
      
      for (const testCase of testCases) {
        const { arcName, pragmaType } = deriveArcNameAndPragma(testCase.logicalId)
        
        assert.strictEqual(
          arcName,
          testCase.expectedArcName,
          `Expected arc name "${testCase.expectedArcName}" for unrecognized "${testCase.logicalId}", but got "${arcName}"`
        )
        assert.strictEqual(
          pragmaType,
          testCase.expectedPragma,
          `Expected pragma type "${testCase.expectedPragma}" for unrecognized "${testCase.logicalId}", but got "${pragmaType}"`
        )
      }
    })
    
    it('should preserve original logical ID casing for plugins section', () => {
      // Unlike other resource types which are lowercased, plugins should keep original casing
      const testCases = [
        'MyCustomResource',
        'UPPERCASE',
        'MixedCaseResource',
        'camelCaseResource',
        'PascalCaseResource',
      ]
      
      for (const logicalId of testCases) {
        const { arcName, pragmaType } = deriveArcNameAndPragma(logicalId)
        
        assert.strictEqual(
          arcName,
          logicalId,
          `Expected arc name to preserve original casing "${logicalId}", but got "${arcName}"`
        )
        assert.strictEqual(pragmaType, 'plugins')
      }
    })
  })

  describe('Unit Tests: Arc Name Mapper', () => {
    it('should handle EventLambda pattern', () => {
      const result = deriveArcNameAndPragma('FooEventLambda')
      assert.strictEqual(result.arcName, 'foo')
      assert.strictEqual(result.pragmaType, 'events')
    })
    
    it('should handle Topic pattern', () => {
      const result = deriveArcNameAndPragma('BarTopic')
      assert.strictEqual(result.arcName, 'bar')
      assert.strictEqual(result.pragmaType, 'events')
    })
    
    it('should handle HTTP root path (GetIndex)', () => {
      const result = deriveArcNameAndPragma('GetIndexHTTPLambda')
      assert.strictEqual(result.arcName, 'get /')
      assert.strictEqual(result.pragmaType, 'http')
    })
    
    it('should handle HTTP root path (PostIndex)', () => {
      const result = deriveArcNameAndPragma('PostIndexHTTPLambda')
      assert.strictEqual(result.arcName, 'post /')
      assert.strictEqual(result.pragmaType, 'http')
    })
    
    it('should handle HTTP root path (empty path part)', () => {
      const result = deriveArcNameAndPragma('GetHTTPLambda')
      assert.strictEqual(result.arcName, 'get /')
      assert.strictEqual(result.pragmaType, 'http')
    })
    
    it('should handle HTTP single segment path', () => {
      const result = deriveArcNameAndPragma('GetApiHTTPLambda')
      assert.strictEqual(result.arcName, 'get /api')
      assert.strictEqual(result.pragmaType, 'http')
    })
    
    it('should handle HTTP multi-segment path', () => {
      const result = deriveArcNameAndPragma('PostApiUsersHTTPLambda')
      assert.strictEqual(result.arcName, 'post /api/users')
      assert.strictEqual(result.pragmaType, 'http')
    })
    
    it('should handle HTTP complex multi-segment path', () => {
      const result = deriveArcNameAndPragma('GetApiV1UsersProfileHTTPLambda')
      assert.strictEqual(result.arcName, 'get /api/v1/users/profile')
      assert.strictEqual(result.pragmaType, 'http')
    })
    
    it('should handle all HTTP methods', () => {
      const methods = [
        { input: 'GetApiHTTPLambda', expected: 'get /api' },
        { input: 'PostApiHTTPLambda', expected: 'post /api' },
        { input: 'PutApiHTTPLambda', expected: 'put /api' },
        { input: 'PatchApiHTTPLambda', expected: 'patch /api' },
        { input: 'DeleteApiHTTPLambda', expected: 'delete /api' },
        { input: 'HeadApiHTTPLambda', expected: 'head /api' },
        { input: 'OptionsApiHTTPLambda', expected: 'options /api' },
      ]
      
      for (const { input, expected } of methods) {
        const result = deriveArcNameAndPragma(input)
        assert.strictEqual(result.arcName, expected)
        assert.strictEqual(result.pragmaType, 'http')
      }
    })
    
    it('should handle Table pattern', () => {
      const result = deriveArcNameAndPragma('DataTable')
      assert.strictEqual(result.arcName, 'data')
      assert.strictEqual(result.pragmaType, 'tables')
    })
    
    it('should handle Queue pattern', () => {
      const result = deriveArcNameAndPragma('TasksQueue')
      assert.strictEqual(result.arcName, 'tasks')
      assert.strictEqual(result.pragmaType, 'queues')
    })
    
    it('should handle Websocket pattern', () => {
      const result = deriveArcNameAndPragma('ChatWebsocket')
      assert.strictEqual(result.arcName, 'chat')
      assert.strictEqual(result.pragmaType, 'ws')
    })
    
    it('should handle Scheduled pattern', () => {
      const result = deriveArcNameAndPragma('DailyScheduled')
      assert.strictEqual(result.arcName, 'daily')
      assert.strictEqual(result.pragmaType, 'scheduled')
    })
    
    it('should fallback to plugins for unrecognized patterns', () => {
      const result = deriveArcNameAndPragma('CustomResource')
      assert.strictEqual(result.arcName, 'CustomResource')
      assert.strictEqual(result.pragmaType, 'plugins')
    })
    
    it('should fallback to plugins for DiscoBucket', () => {
      const result = deriveArcNameAndPragma('DiscoBucket')
      assert.strictEqual(result.arcName, 'DiscoBucket')
      assert.strictEqual(result.pragmaType, 'plugins')
    })
    
    it('should preserve casing for plugins section', () => {
      const testCases = [
        'MyCustomResource',
        'UPPERCASE',
        'lowercase',
        'MixedCase',
      ]
      
      for (const logicalId of testCases) {
        const result = deriveArcNameAndPragma(logicalId)
        assert.strictEqual(result.arcName, logicalId)
        assert.strictEqual(result.pragmaType, 'plugins')
      }
    })
    
    it('should lowercase arc names for known resource types', () => {
      const testCases = [
        { input: 'FOOEventLambda', expectedArcName: 'foo', expectedPragma: 'events' },
        { input: 'BARTopic', expectedArcName: 'bar', expectedPragma: 'events' },
        { input: 'DATATable', expectedArcName: 'data', expectedPragma: 'tables' },
        { input: 'TASKSQueue', expectedArcName: 'tasks', expectedPragma: 'queues' },
        { input: 'CHATWebsocket', expectedArcName: 'chat', expectedPragma: 'ws' },
        { input: 'DAILYScheduled', expectedArcName: 'daily', expectedPragma: 'scheduled' },
      ]
      
      for (const { input, expectedArcName, expectedPragma } of testCases) {
        const result = deriveArcNameAndPragma(input)
        assert.strictEqual(result.arcName, expectedArcName)
        assert.strictEqual(result.pragmaType, expectedPragma)
      }
    })
  })
})