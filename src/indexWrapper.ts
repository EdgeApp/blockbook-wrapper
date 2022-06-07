import { IncomingMessage } from 'http'
import { WebSocket, WebSocketServer } from 'ws'

import { config } from './config'
import { getAccountInfo } from './endpoints/getAccountInfo'
import { getAccountUtxo } from './endpoints/getAccountUtxo'
import { getInfo, getInfoEngine } from './endpoints/getInfo'
import { getTransaction } from './endpoints/getTransaction'
import { ping } from './endpoints/ping'
import { sendTransaction } from './endpoints/sendTransaction'
import { subscribeAddressesEngine } from './endpoints/subscribeAddresses'
import {
  asJsonRpc,
  GetInfoResponse,
  JsonRpc,
  JsonRpcResponse,
  MethodMap,
  WrapperIo,
  WsConnection
} from './types'
import { pinoLogger, snooze } from './util'

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
    pinoLogger.info({ addrPort }, `New websocket connection`)

    const wsc = makeWsConnection(ws, addrPort)
    wsConnections[addrPort] = wsc
  } catch (err) {
    pinoLogger.error({ err, message: 'New websocket connection error ' })
    ws.close(1011, 'Internal error')
  }
})

const makeWsConnection = (ws: WebSocket, addrPort: string): WsConnection => {
  const logger = pinoLogger.child({ addrPort })

  let subscribeNewBlockId: string = ''
  let subscribeAddressesStop

  const methods: MethodMap = {
    getAccountInfo,
    getAccountUtxo,
    getInfo,
    getTransaction,
    sendTransaction,
    ping,
    subscribeAddresses: async (
      io: WrapperIo,
      data: JsonRpc
    ): Promise<JsonRpcResponse> => {
      await snooze(0) // TS hack
      if (subscribeAddressesStop != null) subscribeAddressesStop()
      subscribeAddressesStop = subscribeAddressesEngine(io, data)

      const out: JsonRpcResponse = {
        id: data.id,
        data: { subscribed: true }
      }
      return out
    },
    subscribeNewBlock: async (
      io: WrapperIo,
      data: JsonRpc
    ): Promise<JsonRpcResponse> => {
      await snooze(0) // TS hack
      subscribeNewBlockId = data.id
      const out: JsonRpcResponse = {
        id: data.id,
        data: { subscribed: true }
      }
      return out
    }
  }

  const handleWsMessage = async (
    io: WrapperIo,
    request: JsonRpc
  ): Promise<any> => {
    io.logger.info({ ...request }, `Received ws message`)
    const method = methods[request.method]
    if (method == null) {
      throw new Error('Invalid method: ' + request.method)
    }
    const response = await method(io, request)
    io.logger.info({
      msg: `Responded ws message`,
      data: response
    })
    return response
  }

  const io: WrapperIo = {
    logger,
    sendWs: (data: Object) => {
      ws.send(JSON.stringify(data), sendErrorHandler)
    }
  }

  const sendErrorHandler = (error?: Error): void => {
    if (error != null) {
      logger.error({ err: error, msg: 'Error sending data to WS' })
      // Delete connection
      stopWs()
    } else {
      logger.debug('Success sending data to WS')
    }
  }

  ws.on('message', (message: Buffer) => {
    const messageString = message.toString()
    let jsonRpcRequest: JsonRpc
    try {
      const parsedData = JSON.parse(messageString)
      jsonRpcRequest = asJsonRpc(parsedData)
      logger.debug({ msg: 'Received JSON', parsedData })
    } catch (err) {
      logger.error({
        err,
        where: 'Invalid JSON from websocket message',
        messageString
      })
      stopWs(1007, 'Invalid JSON')
      return
    }
    handleWsMessage(io, jsonRpcRequest)
      .then(result => {
        const resultString = JSON.stringify(result)
        logger.debug({
          msg: 'Handle websocket message result',
          resultString
        })
        ws.send(resultString, sendErrorHandler)
      })
      .catch((err: Error) => {
        const id = jsonRpcRequest.id
        logger.error({
          err,
          where: 'handleWsMessage error',
          id
        })
        if (id != null) {
          const errorMessage: string =
            err instanceof Error ? err.message : 'Unknown error'
          const resultString = JSON.stringify({
            id,
            data: {
              error: {
                message: `Failed to wrap JSON-RPC call: ${errorMessage}`
              }
            }
          })
          ws.send(resultString, sendErrorHandler)
        }
      })
  })

  ws.on('close', code => {
    logger.info({ code, msg: 'Websocket close' })
    stopWs()
  })

  ws.on('error', err => {
    logger.error({ err, msg: 'Websocket error' })
    stopWs()
  })

  const initWs = (): void => undefined

  const stopWs = (errorCode?: number, errorMessage?: string): void => {
    ws.close(errorCode, errorMessage)
    if (subscribeAddressesStop != null) subscribeAddressesStop()
    delete wsConnections[addrPort]
  }

  const updateBlockHeight = (param: GetInfoResponse): void => {
    if (subscribeNewBlockId !== '') {
      const response: JsonRpcResponse = {
        id: subscribeNewBlockId,
        data: {
          height: param.bestHeight,
          hash: param.bestHash
        }
      }
      ws.send(JSON.stringify(response), sendErrorHandler)
    }
  }

  const out: WsConnection = {
    addrPort,
    initWs,
    stopWs,
    updateBlockHeight
  }

  return out
}

getInfoEngine((response: GetInfoResponse) => {
  for (const addrPort in wsConnections) {
    wsConnections[addrPort].updateBlockHeight(response)
  }
})
