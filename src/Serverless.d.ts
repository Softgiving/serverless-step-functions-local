declare namespace Serverless {
  interface Instance {
    cli: {
      log(str: string): void
    }

    config: {
      servicePath: string
    }

    service: {
      custom?: {
        'serverless-offline': {
          lambdaPort: number
        }
      }

      provider: {
        name: string
        region: string
      }

      functions: {
        [key: string]: Serverless.Function
      }

      package: Serverless.Package

      getAllFunctions(): string[]
    }

    pluginManager: PluginManager
  }

  interface Options {
    debug?: boolean

    simulator?: {
      start?: boolean
      port?: number
    }
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
