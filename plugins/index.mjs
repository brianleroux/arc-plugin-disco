// import { join } from 'node:path'


export let set = {
  customLambdas () {
    return [{name: 'disco', src: './disco' }]
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

    // Grant the disco Lambda permissions to access S3 and DynamoDB
    let vars = cloudformation.Resources.DiscoCustomLambda.Properties.Environment.Variables
    vars.DISCO_BUCKET = {
      Ref: 'DiscoBucket'
    }
    vars.DISCO_TABLE = {
      Ref: 'DiscoTable'
    }

    // Add IAM policy for disco Lambda to access the bucket and table
    cloudformation.Resources.DiscoPolicy = {
      Type: 'AWS::IAM::Policy',
      Properties: {
        PolicyName: 'DiscoResourcePolicy',
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

    // Collect all resource names to add as dependencies
    const allResources = Object.keys(cloudformation.Resources).filter(
      name => name !== 'DiscoCustomResource' // Don't depend on itself
    )

    // Add Custom Resource that triggers the disco Lambda
    cloudformation.Resources.DiscoCustomResource = {
      Type: 'AWS::CloudFormation::CustomResource',
      DependsOn: allResources,
      Properties: {
        ServiceToken: {
          'Fn::GetAtt': ['DiscoCustomLambda', 'Arn']
        }
      }
    }

    return cloudformation
  }
}
