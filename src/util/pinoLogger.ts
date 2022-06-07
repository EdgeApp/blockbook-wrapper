import pino from 'pino'

export const pinoLogger = pino({
  level: process.env.VERBOSE == null ? 'info' : 'debug'
})
