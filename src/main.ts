import { get as getProperty } from 'lodash'
import { CUSTOM_OPTIONS, DEFAULT_OPTIONS } from './config'

export default class ServerlessStepFunctionLocal {
  private readonly serverless: Serverless.Instance
  private readonly options: Serverless.Options

  private readonly hooks: any

  constructor(serverless: Serverless.Instance, options: Serverless.Options) {
    this.serverless = serverless
    this.options = options

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

    console.log({ options: this.options, hooks: this.hooks })
  }

  get settings() {
    const custom = getProperty(this.serverless.service.custom, CUSTOM_OPTIONS, {})

    return {
      ...DEFAULT_OPTIONS(this.serverless),
      ...custom,
      ...this.options
    }
  }
}
