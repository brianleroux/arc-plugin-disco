import { describe, it } from 'node:test'
import assert from 'node:assert'
import { extractStackId } from '../disco-up/stack-id-extractor.mjs'

describe('Stack ID Extractor', () => {
  
  describe('Property 10: Stack ID Extraction from ARN', () => {
    it('should extract UUID from valid CloudFormation StackId ARNs', () => {
      // **Property 10: Stack ID Extraction from ARN**
      // **Validates: Requirements 4.3**
      
      // Generate test cases with various valid UUIDs and stack names
      const testCases = [
        {
          uuid: '201c12d0-0721-11ee-b056-02bec084ce62',
          stackName: 'disco-prototype',
          region: 'us-east-1',
          account: '123456789012'
        },
        {
          uuid: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          stackName: 'my-stack',
          region: 'us-west-2',
          account: '987654321098'
        },
        {
          uuid: '12345678-1234-1234-1234-123456789012',
          stackName: 'test-stack-name',
          region: 'eu-west-1',
          account: '111111111111'
        },
        {
          uuid: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
          stackName: 'stack-with-hyphens',
          region: 'ap-southeast-1',
          account: '999999999999'
        },
        {
          uuid: '00000000-0000-0000-0000-000000000000',
          stackName: 's',
          region: 'us-east-1',
          account: '123456789012'
        }
      ]
      
      for (const testCase of testCases) {
        const stackIdArn = `arn:aws:cloudformation:${testCase.region}:${testCase.account}:stack/${testCase.stackName}/${testCase.uuid}`
        const extractedId = extractStackId(stackIdArn)
        
        assert.strictEqual(
          extractedId,
          testCase.uuid,
          `Expected to extract UUID "${testCase.uuid}" from ARN "${stackIdArn}", but got "${extractedId}"`
        )
      }
    })
    
    it('should extract UUID regardless of region or account variations', () => {
      // Test property across different AWS regions and account IDs
      const regions = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1', 'sa-east-1']
      const accounts = ['123456789012', '000000000000', '999999999999', '111111111111']
      const stackNames = ['stack', 'my-stack', 'test-stack-123', 'stack-with-many-hyphens']
      const uuid = 'abcd1234-5678-90ef-ghij-klmnopqrstuv'
      
      for (const region of regions) {
        for (const account of accounts) {
          for (const stackName of stackNames) {
            const stackIdArn = `arn:aws:cloudformation:${region}:${account}:stack/${stackName}/${uuid}`
            const extractedId = extractStackId(stackIdArn)
            
            assert.strictEqual(
              extractedId,
              uuid,
              `Failed to extract UUID from ARN with region=${region}, account=${account}, stackName=${stackName}`
            )
          }
        }
      }
    })
  })
  
  describe('Unit Tests: Stack ID Extractor', () => {
    it('should extract UUID from valid ARN', () => {
      const stackIdArn = 'arn:aws:cloudformation:us-east-1:123456789012:stack/disco-prototype/201c12d0-0721-11ee-b056-02bec084ce62'
      const result = extractStackId(stackIdArn)
      
      assert.strictEqual(result, '201c12d0-0721-11ee-b056-02bec084ce62')
    })
    
    it('should fall back to "resources" for malformed ARN', () => {
      const malformedArns = [
        'not-an-arn',
        'arn:aws:cloudformation',
        'arn:aws:cloudformation:us-east-1',
        'arn:aws:cloudformation:us-east-1:123456789012',
        'arn:aws:cloudformation:us-east-1:123456789012:stack',
        'arn:aws:cloudformation:us-east-1:123456789012:stack/name',
        ''
      ]
      
      for (const arn of malformedArns) {
        const result = extractStackId(arn)
        assert.strictEqual(
          result,
          'resources',
          `Expected "resources" for malformed ARN "${arn}", but got "${result}"`
        )
      }
    })
    
    it('should fall back to "resources" for null input', () => {
      const result = extractStackId(null)
      assert.strictEqual(result, 'resources')
    })
    
    it('should fall back to "resources" for undefined input', () => {
      const result = extractStackId(undefined)
      assert.strictEqual(result, 'resources')
    })
    
    it('should fall back to "resources" for non-string input', () => {
      const result = extractStackId(12345)
      assert.strictEqual(result, 'resources')
    })
    
    it('should extract non-UUID values if present (with warning)', () => {
      // Even if the last component is not a valid UUID, it should still be extracted
      const stackIdArn = 'arn:aws:cloudformation:us-east-1:123456789012:stack/my-stack/not-a-uuid'
      const result = extractStackId(stackIdArn)
      
      assert.strictEqual(result, 'not-a-uuid')
    })
    
    it('should handle ARNs with extra slashes in stack name', () => {
      // Stack names shouldn't have slashes, but if they do, we take the last component
      const stackIdArn = 'arn:aws:cloudformation:us-east-1:123456789012:stack/nested/stack/name/201c12d0-0721-11ee-b056-02bec084ce62'
      const result = extractStackId(stackIdArn)
      
      assert.strictEqual(result, '201c12d0-0721-11ee-b056-02bec084ce62')
    })
  })
})
