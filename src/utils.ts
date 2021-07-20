import { get as getProperty } from 'lodash'

export const getOfflineLambdaPort = (serverless: Serverless.Instance): number => {
  const config =
    (serverless.service.custom && serverless.service.custom['serverless-offline']) || {}

  const port = Number(getProperty(config, 'lambdaPort', 3002))

  return Number.isNaN(port) ? 3002 : port
}

const getFunctionName = (serverless: Serverless.Instance, { Resource, Parameters }: any) => {
  if (typeof Resource === 'string' && Resource !== 'arn:aws:states:::lambda:invoke') {
    const func = serverless.service.functions[Resource]
    return func ? func.name : undefined
  }

  if (
    Resource === 'arn:aws:states:::lambda:invoke' &&
    typeof Parameters === 'object' &&
    Parameters.FunctionName
  ) {
    if (typeof Parameters.FunctionName === 'string') {
      const func = serverless.service.functions[Parameters.FunctionName]
      return func ? func.name : undefined
    } else if (typeof Parameters.FunctionName === 'object') {
      const name = Parameters.FunctionName['Fn::GetAtt'][0]
      const func = serverless.service.functions[name]
      return func ? func.name : undefined
    }
  }

  const name = Resource['Fn::GetAtt'][0]
  const func = serverless.service.functions[name]
  return func ? func.name : undefined
}

const isValidState = (state: any, serverless: Serverless.Instance) => {
  if (!state || typeof state !== 'object') {
    return false
  }

  if (typeof state.Type !== 'string') {
    return false
  }

  if (state.Type === 'Task') {
    const name = getFunctionName(serverless, state)

    if (!name) return false

    state.Resource = `arn:aws:lambda:${serverless.service.provider.region}:123456789012:function:${name}:$LATEST`
  }

  return true
}

export const isValidDefinition = (definition: any, serverless: Serverless.Instance) => {
  if (!definition || typeof definition !== 'object') {
    return false
  }

  if (typeof definition.StartAt !== 'string') {
    return false
  }

  if (typeof definition.States !== 'object') {
    return false
  }

  if (!definition.States[definition.StartAt]) {
    return false
  }

  for (const state in definition.States) {
    if (!isValidState(definition.States[state], serverless)) {
      return false
    }
  }

  return true
}
