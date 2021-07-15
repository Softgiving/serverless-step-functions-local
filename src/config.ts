import { getOfflineLambdaPort } from './utils'

export const CUSTOM_OPTIONS = '@softgiving/serverless-step-functions-local'

export const DEFAULT_OPTIONS = (serverless: Serverless.Instance) => ({
  aws: {
    region: serverless.service.provider.region
  },
  offline: {
    port: getOfflineLambdaPort(serverless)
  },
  simulator: {
    start: true,
    port: 4584
  },
  debug: false
})
