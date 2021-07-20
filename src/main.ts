import StepFunctionsLocal from 'stepfunctions-localhost'

import { get as getProperty } from 'lodash'
import { StepFunctions } from 'aws-sdk'
import { waitUntilUsed } from 'tcp-port-used'

import { CUSTOM_OPTIONS, DEFAULT_OPTIONS } from './config'
import { isValidDefinition } from './utils'
class ServerlessStepFunctionLocal {
  private readonly serverless: Serverless.Instance

  public readonly hooks = {
    'offline:start:init': () => {
      this.init()
      this.start()
    },
    'offline:start:end': () => {
      try {
        this.log('Shutting down...')
        this.simulator.stop()
      } catch {}
    }
  }

  private simulator = new StepFunctionsLocal({})
  private stateMachines: Map<string, any> = new Map()

  constructor(serverless: Serverless.Instance) {
    this.serverless = serverless

    serverless.configSchemaHandler.defineCustomProperties({
      type: 'object',
      properties: {
        debug: { type: 'boolean' },
        simulatorStart: { type: 'boolean' },
        simulatorPort: { type: 'number' }
      },
      required: []
    })

    if (this.serverless.service.provider.name !== 'aws') {
      throw new Error(
        '[Serverless Step Function Local] This plugin is for AWS Step Functions, the provider name must be set to "aws"'
      )
    }

    if (typeof this.serverless.service.provider.region !== 'string') {
      throw new Error(
        '[Serverless Step Function Local] You must specify a region in the provider settings of your Serverless config'
      )
    }
  }

  log(message: string, level: 'info' | 'notify' | 'warn' | 'error' = 'info') {
    if (this.settings.debug || level !== 'info')
      this.serverless.cli.log(`[Serverless Step Function Local]: ${message}`)
  }

  get settings() {
    const custom = getProperty(this.serverless.service.custom, CUSTOM_OPTIONS, {})

    return {
      ...DEFAULT_OPTIONS(this.serverless),
      ...custom
    }
  }

  get config() {
    return this.serverless.service.initialServerlessConfig
  }

  private init() {
    this.log('Initializing...')

    const stateMachines: {
      [key: string]: any
    } = this.config?.stepFunctions?.stateMachines

    if (typeof stateMachines !== 'object') {
      this.log('No stateMachines are defined in your stepFunctions config', 'warn')
      return
    }

    for (const [key, value] of Object.entries(stateMachines)) {
      if (!value || typeof value !== 'object') {
        this.log(`State Machine ${key} has an invalid value`, 'warn')
        continue
      }

      if (!isValidDefinition(value.definition, this.serverless)) {
        console.log(value.definition)
        this.log(`State Machine ${key} has an invalid definition`, 'warn')
        continue
      }

      this.stateMachines.set(value?.name ?? key, value.definition)
    }

    this.log(`You have ${this.stateMachines.size} StateMachines with valid definitions`)
    this.log('Waiting for serverless-offline to start...')
  }

  private async start() {
    this.log('serverless-offline has started... starting...')

    try {
      await this.startSimulator()
      await this.createStateMachines()
    } catch (error) {
      this.log('Simulator could not start or was not detected', 'error')
    }
  }

  private async startSimulator() {
    if (this.settings.simulatorStart) {
      this.log('Starting step functions simulator...')

      await this.simulator.install()

      this.simulator
        .start({
          region: this.settings.aws.region,
          lambdaEndpoint: `http://localhost:${this.settings.offline.port}`,
          lambdaRegion: this.settings.aws.region
        })
        .on('data', (data: any) => {
          this.log(data.toString(), 'notify')
        })
    } else {
      this.log('Assuming step functions simulator is running...')
    }

    const port = this.settings.simulatorStart ? 8083 : this.settings.simulatorPort

    await waitUntilUsed(port, 500, 60 * 1000)
  }

  private async createStateMachines() {
    const port = this.settings.simulatorStart ? 8083 : this.settings.simulatorPort

    const api = new StepFunctions({
      region: this.settings.aws.region,
      credentials: {
        accessKeyId: 'fake',
        secretAccessKey: 'fake'
      },
      endpoint: `http://localhost:${port}`
    })

    this.log(`Creating ${this.stateMachines.size} StateMachines...`)
    for await (const [key, _value] of this.stateMachines.entries()) {
      this.log(`Creating StateMachine ${key}...`)

      try {
        const result = await api
          .createStateMachine({
            name: key,
            definition: JSON.stringify(this.stateMachines.get(key)),
            roleArn: 'arn:aws:iam::123456789012:role/DummyRole'
          })
          .promise()

        this.log(`StateMachine ${key} created ARN: ${result.stateMachineArn}`, 'notify')
      } catch (error) {
        this.log(`Error creating StateMachine ${key}: ${error.message}`, 'error')
      }
    }
  }
}

export = ServerlessStepFunctionLocal
