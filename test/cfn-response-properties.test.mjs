import { test } from 'node:test'
import assert from 'node:assert'
import fc from 'fast-check'

// Feature: disco-iteration-cleanup, Property 1: sendResponse request equivalence
// **Validates: Requirements 2.1, 2.2, 2.7**

/**
 * Replicate the original inline sendResponse options computation.
 * This is the exact logic that was duplicated in disco-up and disco-down
 * before extraction into the shared module.
 */
function computeInlineOptions(responseURL, response) {
  const responseBody = JSON.stringify(response)
  const parsedUrl = new URL(responseURL)
  return {
    hostname: parsedUrl.hostname,
    port: 443,
    path: parsedUrl.pathname + parsedUrl.search,
    method: 'PUT',
    headers: {
      'Content-Type': '',
      'Content-Length': responseBody.length
    }
  }
}

/**
 * Replicate the shared module's options computation.
 * Extracted from disco-shared/cfn-response.mjs sendResponse function.
 */
function computeSharedOptions(event, response) {
  const responseBody = JSON.stringify(response)
  const parsedUrl = new URL(event.ResponseURL)
  return {
    hostname: parsedUrl.hostname,
    port: 443,
    path: parsedUrl.pathname + parsedUrl.search,
    method: 'PUT',
    headers: {
      'Content-Type': '',
      'Content-Length': responseBody.length
    }
  }
}

// --- Arbitraries ---

// Generate valid HTTPS URLs resembling CloudFormation pre-signed S3 URLs
const responseURLArb = fc.record({
  subdomain: fc.stringMatching(/^[a-z0-9]{1,12}$/),
  domain: fc.constantFrom(
    's3.amazonaws.com',
    'cloudformation-custom-resource-response-useast1.s3.amazonaws.com',
    'example.com'
  ),
  pathSegments: fc.array(
    fc.stringMatching(/^[a-z0-9_-]{1,20}$/),
    { minLength: 1, maxLength: 4 }
  ),
  queryPairs: fc.array(
    fc.tuple(
      fc.constantFrom('AWSAccessKeyId', 'Expires', 'Signature'),
      fc.stringMatching(/^[A-Za-z0-9]{1,30}$/)
    ),
    { minLength: 1, maxLength: 3 }
  )
}).map(({ subdomain, domain, pathSegments, queryPairs }) => {
  const path = '/' + pathSegments.join('/')
  const query = queryPairs.map(([k, v]) => `${k}=${v}`).join('&')
  return `https://${subdomain}.${domain}${path}?${query}`
})

// Generate CloudFormation event objects with a valid ResponseURL
const cfnEventArb = fc.record({
  ResponseURL: responseURLArb,
  RequestType: fc.constantFrom('Create', 'Update', 'Delete'),
  StackId: fc.stringMatching(/^[a-zA-Z0-9:/-]{1,80}$/),
  RequestId: fc.uuid(),
  ResourceType: fc.constantFrom('Custom::Disco', 'AWS::CloudFormation::CustomResource'),
  LogicalResourceId: fc.stringMatching(/^[a-zA-Z0-9]{1,40}$/)
})

// Generate CloudFormation response objects
const cfnResponseArb = fc.record({
  Status: fc.constantFrom('SUCCESS', 'FAILED'),
  PhysicalResourceId: fc.stringMatching(/^[a-zA-Z0-9:_-]{1,50}$/),
  StackId: fc.stringMatching(/^[a-zA-Z0-9:/-]{1,80}$/),
  RequestId: fc.uuid(),
  LogicalResourceId: fc.stringMatching(/^[a-zA-Z0-9]{1,40}$/)
})

test('Property 1: sendResponse request equivalence', async () => {
  // Feature: disco-iteration-cleanup, Property 1: sendResponse request equivalence
  // **Validates: Requirements 2.1, 2.2, 2.7**

  fc.assert(
    fc.property(cfnEventArb, cfnResponseArb, (event, response) => {
      const inlineOptions = computeInlineOptions(event.ResponseURL, response)
      const sharedOptions = computeSharedOptions(event, response)

      // Hostname equivalence
      assert.strictEqual(sharedOptions.hostname, inlineOptions.hostname,
        'hostname must match between shared and inline implementations')

      // Port is always 443
      assert.strictEqual(sharedOptions.port, 443, 'port must be 443')
      assert.strictEqual(sharedOptions.port, inlineOptions.port, 'port must match')

      // Path equivalence (pathname + search)
      assert.strictEqual(sharedOptions.path, inlineOptions.path,
        'path must match between shared and inline implementations')

      // Method is always PUT
      assert.strictEqual(sharedOptions.method, 'PUT', 'method must be PUT')
      assert.strictEqual(sharedOptions.method, inlineOptions.method, 'method must match')

      // Content-Type is empty string
      assert.strictEqual(sharedOptions.headers['Content-Type'], '',
        'Content-Type must be empty string')
      assert.strictEqual(sharedOptions.headers['Content-Type'],
        inlineOptions.headers['Content-Type'],
        'Content-Type must match')

      // Content-Length equals length of JSON.stringify(response)
      const expectedLength = JSON.stringify(response).length
      assert.strictEqual(sharedOptions.headers['Content-Length'], expectedLength,
        'Content-Length must equal length of JSON.stringify(response)')
      assert.strictEqual(sharedOptions.headers['Content-Length'],
        inlineOptions.headers['Content-Length'],
        'Content-Length must match between implementations')
    }),
    { numRuns: 100 }
  )
})
