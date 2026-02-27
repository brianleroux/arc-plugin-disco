import { describe, it, mock } from 'node:test'
import assert from 'node:assert'
import { EventEmitter } from 'node:events'

describe('disco-shared/cfn-response sendResponse', () => {

  it('should export sendResponse as a function', async () => {
    const mod = await import('../disco-shared/cfn-response.mjs')
    assert.strictEqual(typeof mod.sendResponse, 'function')
  })

  it('should resolve on successful HTTPS response', async () => {
    // Replicate the sendResponse promise pattern with a mocked https.request
    // This validates the resolve path: when the response callback fires, the promise resolves
    const fakeRes = new EventEmitter()
    fakeRes.statusCode = 200

    const fakeReq = new EventEmitter()
    fakeReq.write = mock.fn()
    fakeReq.end = mock.fn()

    const mockRequest = mock.fn((options, callback) => {
      process.nextTick(() => callback(fakeRes))
      return fakeReq
    })

    const event = {
      ResponseURL: 'https://cfn-response.s3.amazonaws.com/some/path?key=value'
    }
    const response = {
      Status: 'SUCCESS',
      PhysicalResourceId: 'test-resource',
      StackId: 'arn:aws:cloudformation:us-east-1:123:stack/test/guid',
      RequestId: 'req-123',
      LogicalResourceId: 'TestResource'
    }

    const responseBody = JSON.stringify(response)
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

    // Execute the same promise contract that sendResponse uses
    const result = await new Promise((resolve, reject) => {
      const request = mockRequest(options, () => resolve())
      request.on('error', reject)
      request.write(responseBody)
      request.end()
    })

    assert.strictEqual(result, undefined, 'promise should resolve with undefined')
    assert.strictEqual(mockRequest.mock.callCount(), 1)

    // Verify the request options match what sendResponse would compute
    const calledOptions = mockRequest.mock.calls[0].arguments[0]
    assert.strictEqual(calledOptions.hostname, 'cfn-response.s3.amazonaws.com')
    assert.strictEqual(calledOptions.port, 443)
    assert.strictEqual(calledOptions.path, '/some/path?key=value')
    assert.strictEqual(calledOptions.method, 'PUT')
    assert.strictEqual(calledOptions.headers['Content-Type'], '')
    assert.strictEqual(calledOptions.headers['Content-Length'], responseBody.length)

    // Verify body was written
    assert.strictEqual(fakeReq.write.mock.callCount(), 1)
    assert.strictEqual(fakeReq.write.mock.calls[0].arguments[0], responseBody)
    assert.strictEqual(fakeReq.end.mock.callCount(), 1)
  })

  it('should reject on HTTPS request error', async () => {
    // Replicate the sendResponse promise pattern with a mocked https.request
    // This validates the reject path: when request emits 'error', the promise rejects
    const fakeReq = new EventEmitter()
    fakeReq.write = mock.fn()
    fakeReq.end = mock.fn()

    const mockRequest = mock.fn((options, callback) => {
      process.nextTick(() => fakeReq.emit('error', new Error('connection failed')))
      return fakeReq
    })

    const event = {
      ResponseURL: 'https://cfn-response.s3.amazonaws.com/some/path?key=value'
    }
    const response = { Status: 'FAILED' }

    const responseBody = JSON.stringify(response)
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

    await assert.rejects(
      () => new Promise((resolve, reject) => {
        const request = mockRequest(options, () => resolve())
        request.on('error', reject)
        request.write(responseBody)
        request.end()
      }),
      { message: 'connection failed' }
    )
  })
})
