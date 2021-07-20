import { getOfflineLambdaPort } from './utils'

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
