import { IncomingMessage } from 'http'
import { WebSocket, WebSocketServer } from 'ws'

import { config } from './config'
import { getAccountInfo } from './getAccountInfo'
import { getAccountUtxo } from './getAccountUtxo'
import { getInfo, getInfoEngine } from './getInfo'
import { getTransaction } from './getTransaction'
import { ping } from './ping'
import { sendTransaction } from './sendTransaction'
import {
  asJsonRpc,
  GetInfoResponse,
  MethodMap,
  WrapperIo,
  WsConnection
} from './types'
import { logger, makeDate } from './util'

// const CONFIG = require('../config.json')

const server = new WebSocketServer({ port: config.wsPort })

const wsConnections: { [addrPort: string]: WsConnection } = {}

server.on('connection', (ws: WebSocket, req: IncomingMessage) => {
  const { socket, url } = req
  if (url !== '/websocket') {
    ws.close(1003, `Invalid path. Only /websocket supported`)
  }
  try {
    const address = socket.remoteAddress
    const port = socket.remotePort
    const addrPort = `${address}:${port}`
    logger(`Connection made ${addrPort}`)

    const wsc = makeWsConnection(ws, addrPort)
    wsConnections[addrPort] = wsc
  } catch (e) {
    ws.close(1011, 'Internal error')
  }
})

const methods: MethodMap = {
  getAccountInfo: {
    handler: getAccountInfo
  },
  getAccountUtxo: {
    handler: getAccountUtxo
  },
  getInfo: {
    handler: getInfo
  },
  getTransaction: {
    handler: getTransaction
  },
  sendTransaction: {
    handler: sendTransaction
  },
  ping: { handler: ping }
}

const handleWsMessage = async (io: WrapperIo, data: Object): Promise<any> => {
  const cleanData = asJsonRpc(data)
  io.logger(`Received ID:${cleanData.id} Method:${cleanData.method}`)
  const { params = 'NO_PARAMS' } = cleanData
  io.logger(` Params:${JSON.stringify(params)}`)
  const method = methods[cleanData.method]
  if (method == null) {
    throw new Error('Invalid method: ' + cleanData.method)
  }
  const out = await method.handler(io, cleanData)
  io.logger(`Responded to ID:${cleanData.id} Method:${cleanData.method}`)
  io.logger(`   ${JSON.stringify(out).slice(0, 75)}`)
  return out
}

const makeWsConnection = (ws: WebSocket, addrPort: string): WsConnection => {
  const logger = (...args): void => {
    const d = makeDate()
    console.log(`${d} ${addrPort}`, ...args)
  }

  const io: WrapperIo = {
    logger,
    ws
  }

  const sendErrorHandler = (error?: Error): void => {
    if (error != null) {
      logger('Error sending data to WS', error.message)
      // Delete connection
      stopWs()
    } else {
      // logger('Success sending data to WS')
    }
  }

  ws.on('message', (message: Buffer) => {
    const messageString = message.toString()
    let parsedData
    try {
      parsedData = JSON.parse(messageString)
      // logger('Received JSON:', parsedData)
    } catch (e) {
      logger('Invalid JSON:', messageString)
      stopWs(1007, 'Invalid JSON')
    }
    handleWsMessage(io, parsedData)
      .then(result => {
        const resultString = JSON.stringify(result)
        // logger(resultString)
        ws.send(resultString, sendErrorHandler)
      })
      .catch((e: Error) => {
        console.log(e.message)
      })
  })

  ws.on('close', error => {
    logger('Websocket close', error)
    stopWs()
  })

  ws.on('error', error => {
    logger('Websocket error', error)
    stopWs()
  })

  const initWs = (): void => undefined

  const stopWs = (errorCode?: number, errorMessage?: string): void => {
    ws.close(errorCode, errorMessage)
    delete wsConnections[addrPort]
  }

  const out: WsConnection = {
    addrPort,
    initWs,
    stopWs
  }

  return out
}

getInfoEngine((response: GetInfoResponse) => undefined)
