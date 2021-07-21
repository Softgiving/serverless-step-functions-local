import { get as getProperty } from 'lodash'
import ServerlessStepFunctionLocal from './main'

export const CUSTOM_OPTIONS = '@softgiving/serverless-step-functions-local'

export const DEFAULT_OPTIONS = (serverless: Serverless.Instance) => ({
  aws: {
    region: serverless.service.provider.region
  },
  offline: {
    port: getOfflineLambdaPort(serverless)
  },
  simulatorStart: true,
  simulatorPort: 8083,
  debug: false
})

const getOfflineLambdaPort = (serverless: Serverless.Instance): number => {
  const config =
    (serverless.service.custom && serverless.service.custom['serverless-offline']) || {}

  return Number(getProperty(config, 'lambdaPort', 3002))
}

export class Config {
  private instance: ServerlessStepFunctionLocal

  constructor(serverless: ServerlessStepFunctionLocal) {
    this.instance = serverless
  }

  public get settings() {
    const custom = getProperty(this.instance.serverless.service.custom, CUSTOM_OPTIONS, {})

    return {
      ...DEFAULT_OPTIONS(this.instance.serverless),
      ...custom
    }
  }
}
