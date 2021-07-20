declare module 'stepfunctions-localhost' {
  class StepFunctions {
    constructor(options: any)

    install(): Promise<void>
    start(options?: any): any
    stop(): void
  }

  export = StepFunctions
}
