/**
 * Stack ID Extractor Module
 * Extracts the unique UUID from CloudFormation StackId ARN
 */

/**
 * Extracts the unique stack UUID from a CloudFormation StackId ARN
 * @param {string} stackIdArn - CloudFormation StackId ARN
 * @returns {string} - Stack UUID or fallback value "resources"
 * 
 * Example:
 * Input: "arn:aws:cloudformation:us-east-1:123456789012:stack/disco-prototype/201c12d0-0721-11ee-b056-02bec084ce62"
 * Output: "201c12d0-0721-11ee-b056-02bec084ce62"
 */
export function extractStackId(stackIdArn) {
  try {
    // Validate input
    if (!stackIdArn || typeof stackIdArn !== 'string') {
      console.warn('Invalid StackId ARN (null, undefined, or not a string), using fallback key "resources"')
      return 'resources'
    }
    
    // Parse ARN by splitting on '/'
    const parts = stackIdArn.split('/')
    if (parts.length < 3) {
      console.warn(`Malformed StackId ARN "${stackIdArn}", using fallback key "resources"`)
      return 'resources'
    }
    
    // Extract the last component (UUID)
    const stackId = parts[parts.length - 1]
    
    // Optional: Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(stackId)) {
      console.warn(`Stack ID "${stackId}" does not match UUID format, using anyway`)
    }
    
    return stackId
  } catch (error) {
    console.error('Error extracting stack ID:', error)
    return 'resources'
  }
}
