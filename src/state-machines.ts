import ServerlessStepFunctionLocal from './main'

import { StepFunctions } from 'aws-sdk'

const AWS_STATE_ARN_PREFIX = 'arn:aws:states:::'

export class StateMachines {
  private instance: ServerlessStepFunctionLocal

  private stateMachines: Map<string, StepFunctionStateMachine> = new Map()

  constructor(serverless: ServerlessStepFunctionLocal) {
    this.instance = serverless
  }

  getStateMachines() {
    const config = this.instance.serverless.service.initialServerlessConfig

    if (!config || !config.stepFunctions || !config.stepFunctions.stateMachines) {
      this.instance.log('Could not find any State Machines, did you configure any?', 'warn')

      return this.stateMachines
    }

    for (const [Name, Definition] of config.stepFunctions.stateMachines) {
      if (!this.validateDefinition(Definition) || typeof Name !== 'string') {
        this.instance.log(
          `Invalid state machine definition for Machine "${Name.toString()}"`,
          'error'
        )
      } else {
        this.stateMachines.set(Name, Definition)
      }
    }

    return this.stateMachines
  }

  getFunctionKeyFromObject(name: { [key: string]: any }) {
    if (name['Fn::GetAtt']) {
      return name['Fn::GetAtt'][0] as string
    } else if (name['Ref']) {
      return name['Ref'] as string
    }

    return null
  }

  getLambdaName(state: StepFunctionState) {
    let lambdaKey

    if (typeof state.Resource === 'string' && !state.Resource.startsWith(AWS_STATE_ARN_PREFIX)) {
      lambdaKey = state.Resource
    } else if (typeof state.Resource === 'object') {
      lambdaKey = this.getFunctionKeyFromObject(state.Resource)
    } else if (!state.Parameters || !state.Parameters.FunctionName) {
      lambdaKey = null
    } else if (typeof state.Parameters.FunctionName === 'string') {
      lambdaKey = state.Parameters.FunctionName
    } else {
      lambdaKey = this.getFunctionKeyFromObject(state.Parameters.FunctionName)
    }

    if (!lambdaKey) {
      return null
    }

    const lambda = this.instance.serverless.service.functions[lambdaKey]

    return (lambda && lambda.name) || null
  }

  validateState(state: StepFunctionState) {
    if (!state || typeof state !== 'object' || typeof state.Type !== 'string') {
      return false
    }

    if (state.Type === 'Task') {
      const name = this.getLambdaName(state)

      if (!name) return false

      state.Resource = `arn:aws:lambda:${this.instance.serverless.service.provider.region}:123456789012:function:${name}:$LATEST`
    }

    return true
  }

  validateDefinition(definition: StepFunctionStateMachine): definition is StepFunctionStateMachine {
    return (
      typeof definition === 'object' &&
      typeof definition.StartAt === 'string' &&
      typeof definition.States === 'object' &&
      Object.keys(definition.States).length !== 0 &&
      definition.States[definition.StartAt] &&
      Object.keys(definition.States).every((state) => this.validateState(definition.States[state]))
    )
  }

  async createStateMachines() {
    const settings = this.instance.config.settings
    const port = settings.simulatorStart ? 8083 : settings.simulatorPort

    const api = new StepFunctions({
      region: settings.aws.region,
      credentials: {
        accessKeyId: 'fake',
        secretAccessKey: 'fake'
      },
      endpoint: `http://localhost:${port}`
    })

    const stateMachines = this.getStateMachines()

    this.instance.log(`Creating ${stateMachines.size} StateMachines...`)

    for await (const [key, value] of stateMachines) {
      this.instance.log(`Creating StateMachine ${key}...`)

      try {
        const result = await api
          .createStateMachine({
            name: key,
            definition: JSON.stringify(value),
            roleArn: 'arn:aws:iam::123456789012:role/DummyRole'
          })
          .promise()

        this.instance.log(`StateMachine ${key} created ARN: ${result.stateMachineArn}`, 'notify')
      } catch (error) {
        this.instance.log(`Error creating StateMachine ${key}: ${error.message}`, 'error')
      }
    }
  }
}
