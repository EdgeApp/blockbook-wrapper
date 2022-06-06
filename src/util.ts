import pino from 'pino'

export const pinoLogger = pino({
  level: process.env.VERBOSE == null ? 'info' : 'debug'
})

export function cleanObject(object: Object): void {
  for (const key in object) {
    if (object[key] == null) {
      delete object[key]
    }
  }
}

export const snooze: Function = async (ms: number) =>
  new Promise((resolve: Function) => setTimeout(resolve, ms))
