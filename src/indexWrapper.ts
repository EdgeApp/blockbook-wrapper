import { IncomingMessage } from 'http'
import { WebSocket, WebSocketServer } from 'ws'

import { config } from './config'
import { getAccountInfo } from './getAccountInfo'
import { getAccountUtxo } from './getAccountUtxo'
import { getInfo } from './getInfo'
import { getTransaction } from './getTransaction'
import { ping } from './ping'
import { asJsonRpc, MethodMap, WrapperIo } from './types'
import { logger, makeDate } from './util'

// const CONFIG = require('../config.json')

const server = new WebSocketServer({ port: config.wsPort })

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

    makeWsConnection(ws, addrPort)
  } catch (e) {
    ws.close(1011, 'Internal error')
  }
  // Parse url
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
  ping: { handler: ping }
}

const handleWsMessage = async (io: WrapperIo, data: Object): Promise<any> => {
  const cleanData = asJsonRpc(data)
  io.logger(`Received ID:${cleanData.id} Method:${cleanData.method}`)
  const method = methods[cleanData.method]
  const out = method.handler(io, cleanData)
  io.logger(`Responded to ID:${cleanData.id} Method:${cleanData.method}`)
  return out
}

const makeWsConnection = (ws: WebSocket, addrPort: string): void => {
  const logger = (...args): void => {
    const d = makeDate()
    console.log(`${d} ${addrPort}`, ...args)
  }

  const io: WrapperIo = {
    logger
  }

  const sendErrorHandler = (error?: Error): void => {
    if (error != null) {
      logger('Error sending data to WS', error.message)
      // Delete connection
      deleteWsConnection(addrPort)
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
      ws.close(1007, 'Invalid JSON')
    }
    handleWsMessage(io, parsedData)
      .then(result => {
        const resultString = JSON.stringify(result)
        // logger(resultString)
        ws.send(resultString, sendErrorHandler)
      })
      .catch((e: Error) => console.log(e.message))
  })

  ws.on('close', error => {
    logger('Websocket close', error)
    deleteWsConnection(addrPort)
  })

  ws.on('error', error => {
    logger('Websocket error', error)
    deleteWsConnection(addrPort)
  })

  // ws.send(data, sendErrorHandler)
}

function deleteWsConnection(_addrPort: string): void {
  // const c = wsConnections[addrPort]
  // if (c) {
  //   c.ws.close()
  //   delete wsConnections[addrPort]
  // }
}
