/**
 * Pragma Organizer Module
 * 
 * Groups CloudFormation resources by Architect pragma types into a hierarchical structure.
 */

import { deriveArcNameAndPragma } from './arc-name-mapper.mjs'

/**
 * Organizes resources into a hierarchical map by pragma type
 * @param {Array<{LogicalResourceId: string, PhysicalResourceId: string}>} resources - CloudFormation resources
 * @returns {Object} - Hierarchical resource map organized by pragma type
 * 
 * Example output:
 * {
 *   "http": { "get /": "arn:aws:lambda:..." },
 *   "events": { "foo": "arn:aws:sns:..." },
 *   "tables": { "data": "arn:aws:dynamodb:..." },
 *   "queues": {},
 *   "ws": {},
 *   "scheduled": {},
 *   "plugins": { "DiscoBucket": "arn:aws:s3:::..." }
 * }
 */
export function organizeByPragma(resources) {
  // Initialize empty objects for all pragma types
  const organized = {
    http: {},
    events: {},
    tables: {},
    queues: {},
    ws: {},
    scheduled: {},
    plugins: {}
  }
  
  // Iterate through all CloudFormation resources
  for (const resource of resources) {
    const { arcName, pragmaType } = deriveArcNameAndPragma(resource.LogicalResourceId)
    organized[pragmaType][arcName] = resource.PhysicalResourceId
  }
  
  return organized
}
