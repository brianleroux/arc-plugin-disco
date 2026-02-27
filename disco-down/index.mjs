import { S3Client, ListObjectsV2Command, ListObjectVersionsCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3'

import { sendResponse } from '../disco-shared/cfn-response.mjs'

export async function handler (event) {
  console.log('Custom Resource Event:', JSON.stringify(event, null, 2))

  const requestType = event.RequestType
  const stackName = event.StackId.split('/')[1]
  
  // Always respond to CloudFormation
  const response = {
    Status: 'SUCCESS',
    PhysicalResourceId: `disco-down-${stackName}`,
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId
  }

  try {
    if (requestType === 'Delete') {
      // Perform S3 bucket cleanup
      const s3Client = new S3Client({})
      const bucketName = process.env.DISCO_BUCKET

      console.log(`Cleaning up bucket: ${bucketName}`)

      // List and delete all objects
      await emptyBucket(s3Client, bucketName)

      console.log('Successfully cleaned up S3 bucket')
    }

    // For Create/Update, do nothing (no-op)
    // Always send success response to CloudFormation
    await sendResponse(event, response)
  } catch (error) {
    // Log error but still return SUCCESS to allow stack deletion to proceed
    console.error('Error during cleanup:', error)
    await sendResponse(event, response)
  }
}

async function emptyBucket(s3Client, bucketName) {
  // Delete all object versions (if versioning is enabled)
  let versionsContinuationToken = undefined
  do {
    const listVersionsCommand = new ListObjectVersionsCommand({
      Bucket: bucketName,
      ContinuationToken: versionsContinuationToken
    })
    
    const versionsResponse = await s3Client.send(listVersionsCommand)
    
    if (versionsResponse.Versions?.length > 0 || versionsResponse.DeleteMarkers?.length > 0) {
      const objectsToDelete = []
      
      // Add versions
      if (versionsResponse.Versions) {
        for (const version of versionsResponse.Versions) {
          objectsToDelete.push({
            Key: version.Key,
            VersionId: version.VersionId
          })
        }
      }
      
      // Add delete markers
      if (versionsResponse.DeleteMarkers) {
        for (const marker of versionsResponse.DeleteMarkers) {
          objectsToDelete.push({
            Key: marker.Key,
            VersionId: marker.VersionId
          })
        }
      }
      
      // Batch delete
      if (objectsToDelete.length > 0) {
        const deleteCommand = new DeleteObjectsCommand({
          Bucket: bucketName,
          Delete: {
            Objects: objectsToDelete
          }
        })
        await s3Client.send(deleteCommand)
        console.log(`Deleted ${objectsToDelete.length} object versions`)
      }
    }
    
    versionsContinuationToken = versionsResponse.NextContinuationToken
  } while (versionsContinuationToken)

  // Delete all current objects (non-versioned or current versions)
  let continuationToken = undefined
  do {
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      ContinuationToken: continuationToken
    })
    
    const listResponse = await s3Client.send(listCommand)
    
    if (listResponse.Contents?.length > 0) {
      const objectsToDelete = listResponse.Contents.map(obj => ({
        Key: obj.Key
      }))
      
      const deleteCommand = new DeleteObjectsCommand({
        Bucket: bucketName,
        Delete: {
          Objects: objectsToDelete
        }
      })
      
      await s3Client.send(deleteCommand)
      console.log(`Deleted ${objectsToDelete.length} objects`)
    }
    
    continuationToken = listResponse.NextContinuationToken
  } while (continuationToken)
}
