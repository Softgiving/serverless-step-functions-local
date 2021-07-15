import { get as getProperty } from 'lodash'

export const getOfflineLambdaPort = (serverless: Serverless.Instance): number => {
  const config =
    (serverless.service.custom && serverless.service.custom['serverless-offline']) || {}

  const port = Number(getProperty(config, 'lambdaPort', 3002))

  return Number.isNaN(port) ? 3002 : port
}
