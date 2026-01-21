// import { join } from 'node:path'


export let set = {
  customLambdas () {
    return [
      { name: 'disco-up', src: './disco-up' },
      { name: 'disco-down', src: './disco-down' }
    ]
  }
}

export let deploy = {
  async start ({ arc, cloudformation }) {
    // Add S3 bucket for resource discovery data
    cloudformation.Resources.DiscoBucket = {
      Type: 'AWS::S3::Bucket',
      Properties: {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        },
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256'
              }
            }
          ]
        }
      }
    }

    // Add DynamoDB table for resource discovery
    cloudformation.Resources.DiscoTable = {
      Type: 'AWS::DynamoDB::Table',
      Properties: {
        BillingMode: 'PAY_PER_REQUEST',
        AttributeDefinitions: [
          {
            AttributeName: 'idx',
            AttributeType: 'S'
          }
        ],
        KeySchema: [
          {
            AttributeName: 'idx',
            KeyType: 'HASH'
          }
        ]
      }
    }

    // Grant the disco-up Lambda permissions to access S3 and DynamoDB
    let vars = cloudformation.Resources.DiscoUpCustomLambda.Properties.Environment.Variables
    vars.DISCO_BUCKET = {
      Ref: 'DiscoBucket'
    }
    vars.DISCO_TABLE = {
      Ref: 'DiscoTable'
    }

    // Grant the disco-down Lambda permissions to access S3 bucket
    let downVars = cloudformation.Resources.DiscoDownCustomLambda.Properties.Environment.Variables
    downVars.DISCO_BUCKET = {
      Ref: 'DiscoBucket'
    }

    // Add IAM policy for disco-up Lambda to access the bucket and table
    cloudformation.Resources.DiscoUpPolicy = {
      Type: 'AWS::IAM::Policy',
      Properties: {
        PolicyName: 'DiscoUpResourcePolicy',
        PolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                's3:PutObject',
                's3:GetObject',
                's3:ListBucket'
              ],
              Resource: [
                {
                  'Fn::GetAtt': ['DiscoBucket', 'Arn']
                },
                {
                  'Fn::Sub': '${DiscoBucket.Arn}/*'
                }
              ]
            },
            {
              Effect: 'Allow',
              Action: [
                'dynamodb:PutItem',
                'dynamodb:GetItem',
                'dynamodb:Query',
                'dynamodb:Scan'
              ],
              Resource: {
                'Fn::GetAtt': ['DiscoTable', 'Arn']
              }
            },
            {
              Effect: 'Allow',
              Action: [
                'cloudformation:DescribeStackResources',
                'cloudformation:DescribeStacks'
              ],
              Resource: {
                Ref: 'AWS::StackId'
              }
            }
          ]
        },
        Roles: [
          {
            Ref: 'Role'
          }
        ]
      }
    }

    // Add IAM policy for disco-down Lambda to clean up S3 bucket
    cloudformation.Resources.DiscoDownPolicy = {
      Type: 'AWS::IAM::Policy',
      Properties: {
        PolicyName: 'DiscoDownResourcePolicy',
        PolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                's3:ListBucket',
                's3:ListBucketVersions'
              ],
              Resource: {
                'Fn::GetAtt': ['DiscoBucket', 'Arn']
              }
            },
            {
              Effect: 'Allow',
              Action: [
                's3:DeleteObject',
                's3:DeleteObjectVersion'
              ],
              Resource: {
                'Fn::Sub': '${DiscoBucket.Arn}/*'
              }
            }
          ]
        },
        Roles: [
          {
            Ref: 'Role'
          }
        ]
      }
    }

    // Collect all resource names to add as dependencies
    const allResources = Object.keys(cloudformation.Resources).filter(
      name => name !== 'DiscoUpCustomResource' // Don't depend on itself
    )

    // Add Custom Resource that triggers the disco-down Lambda
    // The BucketName Ref creates an implicit dependency - CloudFormation will
    // invoke this custom resource (triggering cleanup) before deleting the bucket
    cloudformation.Resources.DiscoDownCustomResource = {
      Type: 'AWS::CloudFormation::CustomResource',
      Properties: {
        ServiceToken: {
          'Fn::GetAtt': ['DiscoDownCustomLambda', 'Arn']
        },
        BucketName: {
          Ref: 'DiscoBucket'
        }
      }
    }

    // Add Custom Resource that triggers the disco-up Lambda
    cloudformation.Resources.DiscoUpCustomResource = {
      Type: 'AWS::CloudFormation::CustomResource',
      DependsOn: allResources,
      Properties: {
        ServiceToken: {
          'Fn::GetAtt': ['DiscoUpCustomLambda', 'Arn']
        }
      }
    }

    return cloudformation
  }
}
