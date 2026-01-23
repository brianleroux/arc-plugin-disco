/**
 * Arc Name Mapper
 * 
 * Transforms CloudFormation logical resource IDs into Architect framework names
 * and determines the appropriate pragma type for resource organization.
 */

/**
 * Derives the Architect name and pragma type from a CloudFormation logical resource ID
 * @param {string} logicalId - CloudFormation logical resource ID
 * @returns {{arcName: string, pragmaType: string}} - Arc name and pragma type
 */
export function deriveArcNameAndPragma(logicalId) {
  try {
    // Events: {Name}EventLambda or {Name}Topic
    if (logicalId.endsWith('EventLambda')) {
      const name = logicalId.slice(0, -11).toLowerCase()
      return { arcName: name, pragmaType: 'events' }
    }
    if (logicalId.endsWith('Topic')) {
      const name = logicalId.slice(0, -5).toLowerCase()
      return { arcName: name, pragmaType: 'events' }
    }
    
    // HTTP: {Method}{Path}HTTPLambda
    if (logicalId.endsWith('HTTPLambda')) {
      const routePart = logicalId.slice(0, -10)
      const arcName = convertHttpRoute(routePart)
      return { arcName, pragmaType: 'http' }
    }
    
    // Tables: {Name}Table
    if (logicalId.endsWith('Table')) {
      const name = logicalId.slice(0, -5).toLowerCase()
      return { arcName: name, pragmaType: 'tables' }
    }
    
    // Queues: {Name}Queue
    if (logicalId.endsWith('Queue')) {
      const name = logicalId.slice(0, -5).toLowerCase()
      return { arcName: name, pragmaType: 'queues' }
    }
    
    // Websockets: {Name}Websocket
    if (logicalId.endsWith('Websocket')) {
      const name = logicalId.slice(0, -9).toLowerCase()
      return { arcName: name, pragmaType: 'ws' }
    }
    
    // Scheduled: {Name}Scheduled
    if (logicalId.endsWith('Scheduled')) {
      const name = logicalId.slice(0, -9).toLowerCase()
      return { arcName: name, pragmaType: 'scheduled' }
    }
    
    // Fallback to plugins
    console.warn(`Unrecognized resource pattern: ${logicalId}, placing in plugins section`)
    return { arcName: logicalId, pragmaType: 'plugins' }
  } catch (error) {
    console.error(`Error deriving arc name for ${logicalId}:`, error)
    return { arcName: logicalId, pragmaType: 'plugins' }
  }
}

/**
 * Converts HTTP route part from PascalCase to Architect route format
 * @param {string} routePart - PascalCase route part (e.g., "GetIndex", "PostApiUsers")
 * @returns {string} - Architect route format (e.g., "get /", "post /api/users")
 */
function convertHttpRoute(routePart) {
  // Extract method (first word in PascalCase)
  const methodMatch = routePart.match(/^(Get|Post|Put|Patch|Delete|Head|Options)/)
  if (!methodMatch) {
    // If no method found, return lowercase
    return routePart.toLowerCase()
  }
  
  const method = methodMatch[1].toLowerCase()
  const pathPart = routePart.slice(methodMatch[1].length)
  
  // Convert PascalCase to path segments
  // GetIndex → /
  // GetApiUsers → /api/users
  if (pathPart === 'Index' || pathPart === '') {
    return `${method} /`
  }
  
  const path = pathPart
    .replace(/([A-Z])/g, '/$1')
    .toLowerCase()
    .replace(/^\//, '')
  
  return `${method} /${path}`
}
