import StepFunctionsLocal from 'stepfunctions-localhost'

import { waitUntilUsed } from 'tcp-port-used'

import { StateMachines } from './state-machines'
import { Config } from './config'
class ServerlessStepFunctionLocal {
  public readonly serverless: Serverless.Instance

  public readonly hooks = {
    'offline:start:init': () => {
      this.start()
    },
    'offline:start:end': () => {
      try {
        this.log('Shutting down...')
        this.simulator.stop()
      } catch {}
    }
  }

  public readonly config: Config

  private simulator: StepFunctionsLocal
  private stateMachines: StateMachines

  constructor(serverless: Serverless.Instance) {
    if (serverless.service.provider.name !== 'aws') {
      throw new Error(
        '[Serverless Step Function Local] This plugin is for AWS Step Functions, the provider name must be set to "aws"'
      )
    }

    if (typeof serverless.service.provider.region !== 'string') {
      throw new Error(
        '[Serverless Step Function Local] You must specify a region in the provider settings of your Serverless config'
      )
    }

    this.serverless = serverless

    this.simulator = new StepFunctionsLocal({})
    this.stateMachines = new StateMachines(this)
    this.config = new Config(this)

    this.serverless.configSchemaHandler.defineCustomProperties({
      type: 'object',
      properties: {
        debug: { type: 'boolean' },
        simulatorStart: { type: 'boolean' },
        simulatorPort: { type: 'number' }
      },
      required: []
    })
  }

  log(message: string, level: 'info' | 'notify' | 'warn' | 'error' = 'info') {
    if (this.config.settings.debug || level !== 'info')
      this.serverless.cli.log(`[Serverless Step Function Local]: ${message}`)
  }

  private async start() {
    try {
      await this.startSimulator()
      await this.stateMachines.createStateMachines()
    } catch (error) {
      this.log('Simulator could not start or was not detected', 'error')
    }
  }

  private async startSimulator() {
    const settings = this.config.settings
    if (settings.simulatorStart) {
      this.log('Starting step functions simulator...')

      await this.simulator.install()

      this.simulator
        .start({
          region: settings.aws.region,
          lambdaEndpoint: `http://localhost:${settings.offline.port}`,
          lambdaRegion: settings.aws.region
        })
        .on('data', (data: any) => {
          this.log(data.toString(), 'notify')
        })
    } else {
      this.log('Assuming step functions simulator is running...')
    }

    const port = settings.simulatorStart ? 8083 : settings.simulatorPort

    await waitUntilUsed(port, 100, 1000 * 60)
  }
}

export = ServerlessStepFunctionLocal
