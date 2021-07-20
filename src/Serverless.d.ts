declare namespace Serverless {
  interface Instance {
    cli: {
      log(str: string): void
    }

    config: {
      servicePath: string
    }

    configSchemaHandler: {
      defineCustomProperties(options: any): any
    }

    service: {
      service: string

      custom?: {
        'serverless-offline'?: {
          lambdaPort?: number
        }
        '@softgiving/serverless-step-functions-local': Options
      }

      initialServerlessConfig?: {
        stepFunctions?: {
          stateMachines?: any
        }
      }

      provider: {
        stage: string
        name: string
        region: string
      }

      functions: {
        [key: string]: any
      }

      package: Serverless.Package

      getAllFunctions(): string[]
      getFunction(name: string): Serverless.Function
    }

    pluginManager: PluginManager
  }

  interface Options {
    debug?: boolean

    simulatorStart?: boolean
    simulatorPort?: number
  }

  interface Function {
    handler: string
    package: Serverless.Package
  }

  interface Package {
    include: string[]
    exclude: string[]
    artifact?: string
    individually?: boolean
  }

  interface PluginManager {
    spawn(command: string): Promise<void>
  }
}
