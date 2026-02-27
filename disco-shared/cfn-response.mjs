/**
 * Send a CloudFormation custom resource response
 * @param {Object} event - CloudFormation custom resource event (must have ResponseURL)
 * @param {Object} response - Response object with Status, PhysicalResourceId, StackId, RequestId, LogicalResourceId
 * @returns {Promise<void>}
 */
export async function sendResponse(event, response) {
  const responseBody = JSON.stringify(response)
  const https = await import('https')
  const { URL } = await import('url')

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

  return new Promise((resolve, reject) => {
    const request = https.request(options, (res) => {
      console.log('CloudFormation response status:', res.statusCode)
      resolve()
    })
    request.on('error', reject)
    request.write(responseBody)
    request.end()
  })
}
