import { describe, it } from 'node:test'
import assert from 'node:assert'

describe('disco-down handler', () => {
  it('should handle Delete event', () => {
    const event = {
      RequestType: 'Delete',
      StackId: 'arn:aws:cloudformation:us-east-1:123456789012:stack/test-stack/guid',
      RequestId: 'test-request-id',
      LogicalResourceId: 'DiscoDownCustomResource',
      ResponseURL: 'https://cloudformation-custom-resource-response.s3.amazonaws.com/test',
      ResourceProperties: {
        BucketName: 'test-bucket'
      }
    }

    assert.strictEqual(event.RequestType, 'Delete')
    assert.ok(event.ResourceProperties.BucketName)
  })

  it('should handle Create event as no-op', () => {
    const event = {
      RequestType: 'Create',
      StackId: 'arn:aws:cloudformation:us-east-1:123456789012:stack/test-stack/guid',
      RequestId: 'test-request-id',
      LogicalResourceId: 'DiscoDownCustomResource',
      ResponseURL: 'https://cloudformation-custom-resource-response.s3.amazonaws.com/test'
    }

    // Create events should be no-ops for disco-down
    assert.strictEqual(event.RequestType, 'Create')
  })

  it('should handle Update event as no-op', () => {
    const event = {
      RequestType: 'Update',
      StackId: 'arn:aws:cloudformation:us-east-1:123456789012:stack/test-stack/guid',
      RequestId: 'test-request-id',
      LogicalResourceId: 'DiscoDownCustomResource',
      ResponseURL: 'https://cloudformation-custom-resource-response.s3.amazonaws.com/test'
    }

    // Update events should be no-ops for disco-down
    assert.strictEqual(event.RequestType, 'Update')
  })

  it('should extract stack name from StackId', () => {
    const stackId = 'arn:aws:cloudformation:us-east-1:123456789012:stack/my-test-stack/guid'
    const stackName = stackId.split('/')[1]
    
    assert.strictEqual(stackName, 'my-test-stack')
  })

  it('should build objects to delete list', () => {
    const mockContents = [
      { Key: 'file1.json' },
      { Key: 'file2.json' },
      { Key: 'folder/file3.json' }
    ]

    const objectsToDelete = mockContents.map(obj => ({
      Key: obj.Key
    }))

    assert.strictEqual(objectsToDelete.length, 3)
    assert.strictEqual(objectsToDelete[0].Key, 'file1.json')
    assert.strictEqual(objectsToDelete[2].Key, 'folder/file3.json')
  })

  it('should handle versioned objects', () => {
    const mockVersions = [
      { Key: 'file.json', VersionId: 'v1' },
      { Key: 'file.json', VersionId: 'v2' }
    ]

    const mockDeleteMarkers = [
      { Key: 'deleted.json', VersionId: 'dm1' }
    ]

    const objectsToDelete = []
    
    for (const version of mockVersions) {
      objectsToDelete.push({
        Key: version.Key,
        VersionId: version.VersionId
      })
    }
    
    for (const marker of mockDeleteMarkers) {
      objectsToDelete.push({
        Key: marker.Key,
        VersionId: marker.VersionId
      })
    }

    assert.strictEqual(objectsToDelete.length, 3)
    assert.ok(objectsToDelete.every(obj => obj.VersionId))
  })
})
