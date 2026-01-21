import { describe, it } from 'node:test'
import assert from 'node:assert'
import { set, deploy } from '../plugins/index.mjs'

describe('Plugin Configuration', () => {
  it('should define customLambdas', () => {
    assert.ok(set.customLambdas, 'customLambdas function should exist')
    assert.strictEqual(typeof set.customLambdas, 'function')
  })

  it('should return disco-up and disco-down lambdas', () => {
    const lambdas = set.customLambdas()
    assert.ok(Array.isArray(lambdas), 'should return an array')
    assert.strictEqual(lambdas.length, 2)
    
    const discoUp = lambdas.find(l => l.name === 'disco-up')
    const discoDown = lambdas.find(l => l.name === 'disco-down')
    
    assert.ok(discoUp, 'disco-up lambda should be defined')
    assert.strictEqual(discoUp.src, './disco-up')
    
    assert.ok(discoDown, 'disco-down lambda should be defined')
    assert.strictEqual(discoDown.src, './disco-down')
  })

  it('should define deploy.start function', () => {
    assert.ok(deploy.start, 'deploy.start function should exist')
    assert.strictEqual(typeof deploy.start, 'function')
  })

  it('should add required CloudFormation resources', async () => {
    const mockCloudFormation = {
      Resources: {
        DiscoUpCustomLambda: {
          Type: 'AWS::Lambda::Function',
          Properties: {
            Environment: {
              Variables: {}
            }
          }
        },
        DiscoDownCustomLambda: {
          Type: 'AWS::Lambda::Function',
          Properties: {
            Environment: {
              Variables: {}
            }
          }
        },
        Role: {}
      }
    }

    const result = await deploy.start({
      arc: {},
      cloudformation: mockCloudFormation
    })

    // Check S3 bucket
    assert.ok(result.Resources.DiscoBucket, 'DiscoBucket should be created')
    assert.strictEqual(result.Resources.DiscoBucket.Type, 'AWS::S3::Bucket')
    
    // Check DynamoDB table
    assert.ok(result.Resources.DiscoTable, 'DiscoTable should be created')
    assert.strictEqual(result.Resources.DiscoTable.Type, 'AWS::DynamoDB::Table')
    
    // Check IAM policies
    assert.ok(result.Resources.DiscoUpPolicy, 'DiscoUpPolicy should be created')
    assert.ok(result.Resources.DiscoDownPolicy, 'DiscoDownPolicy should be created')
    
    // Check custom resources
    assert.ok(result.Resources.DiscoUpCustomResource, 'DiscoUpCustomResource should be created')
    assert.ok(result.Resources.DiscoDownCustomResource, 'DiscoDownCustomResource should be created')
    
    // Check environment variables
    assert.ok(result.Resources.DiscoUpCustomLambda.Properties.Environment.Variables.DISCO_BUCKET)
    assert.ok(result.Resources.DiscoUpCustomLambda.Properties.Environment.Variables.DISCO_TABLE)
    assert.ok(result.Resources.DiscoDownCustomLambda.Properties.Environment.Variables.DISCO_BUCKET)
    assert.ok(result.Resources.DiscoDownCustomLambda.Properties.Environment.Variables.DISCO_TABLE)
  })

  it('should add DISCO_BUCKET and DISCO_TABLE to all Lambda functions', async () => {
    const mockCloudFormation = {
      Resources: {
        MyAppLambda: {
          Type: 'AWS::Lambda::Function',
          Properties: {
            Environment: {
              Variables: {
                EXISTING_VAR: 'value'
              }
            }
          }
        },
        AnotherLambda: {
          Type: 'AWS::Lambda::Function',
          Properties: {
            Environment: {
              Variables: {}
            }
          }
        },
        ServerlessFunction: {
          Type: 'AWS::Serverless::Function',
          Properties: {
            Environment: {
              Variables: {
                SOME_VAR: 'test'
              }
            }
          }
        },
        DiscoUpCustomLambda: {
          Type: 'AWS::Lambda::Function',
          Properties: {
            Environment: {
              Variables: {}
            }
          }
        },
        DiscoDownCustomLambda: {
          Type: 'AWS::Lambda::Function',
          Properties: {
            Environment: {
              Variables: {}
            }
          }
        },
        NotALambda: {
          Type: 'AWS::S3::Bucket'
        },
        Role: {}
      }
    }

    const result = await deploy.start({
      arc: {},
      cloudformation: mockCloudFormation
    })

    // Check all Lambda functions have DISCO_BUCKET and DISCO_TABLE
    assert.ok(result.Resources.MyAppLambda.Properties.Environment.Variables.DISCO_BUCKET)
    assert.ok(result.Resources.MyAppLambda.Properties.Environment.Variables.DISCO_TABLE)
    assert.strictEqual(result.Resources.MyAppLambda.Properties.Environment.Variables.EXISTING_VAR, 'value')
    
    assert.ok(result.Resources.AnotherLambda.Properties.Environment.Variables.DISCO_BUCKET)
    assert.ok(result.Resources.AnotherLambda.Properties.Environment.Variables.DISCO_TABLE)
    
    // Check AWS::Serverless::Function also gets the env vars
    assert.ok(result.Resources.ServerlessFunction.Properties.Environment.Variables.DISCO_BUCKET)
    assert.ok(result.Resources.ServerlessFunction.Properties.Environment.Variables.DISCO_TABLE)
    assert.strictEqual(result.Resources.ServerlessFunction.Properties.Environment.Variables.SOME_VAR, 'test')
    
    assert.ok(result.Resources.DiscoUpCustomLambda.Properties.Environment.Variables.DISCO_BUCKET)
    assert.ok(result.Resources.DiscoUpCustomLambda.Properties.Environment.Variables.DISCO_TABLE)
    
    assert.ok(result.Resources.DiscoDownCustomLambda.Properties.Environment.Variables.DISCO_BUCKET)
    assert.ok(result.Resources.DiscoDownCustomLambda.Properties.Environment.Variables.DISCO_TABLE)
    
    // Non-Lambda resources should not be affected
    assert.ok(!result.Resources.NotALambda.Properties)
  })
})
