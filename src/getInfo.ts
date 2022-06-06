import { asNumber, asObject, asString } from 'cleaners'
import fetch from 'node-fetch'
import parse from 'url-parse'

import { config } from './config'
import {
  GetInfoEngineParams,
  GetInfoResponse,
  JsonRpc,
  JsonRpcResponse,
  WrapperIo
} from './types'
import { pinoLogger, snooze } from './util'

const asV2ApiResponse = asObject({
  blockbook: asObject({
    coin: asString,
    decimals: asNumber,
    version: asString,
    bestHeight: asNumber
  }),
  backend: asObject({
    version: asString,
    subversion: asString,
    bestBlockHash: asString
  })
})
export type V2ApiResponse = ReturnType<typeof asV2ApiResponse>

export const lastResponse: GetInfoResponse = {
  name: '',
  shortcut: config.shortcut,
  decimals: 0,
  version: '',
  block0Hash: '',
  testnet: false,
  bestHeight: -1,
  bestHash: '',
  backend: {
    version: '',
    subversion: ''
  }
}
const server = config.blockbookServer

export const getInfo = async (
  io: WrapperIo,
  data: JsonRpc
): Promise<JsonRpcResponse> => {
  let bh = lastResponse.bestHeight // TS hack
  while (bh < 0) {
    await snooze(5000)
    bh = lastResponse.bestHeight
  }
  const dataOut = { ...lastResponse }
  const out: JsonRpcResponse = {
    id: data.id,
    data: dataOut
  }
  return out
}

const getInfoInner = async (cb: GetInfoEngineParams): Promise<void> => {
  const parsed = parse(server, true)
  parsed.set('pathname', `api/v2`)

  const headers = {
    'api-key': config.nowNodesApiKey
  }
  const options = { method: 'GET', headers: headers }

  let cleanedResult: V2ApiResponse
  const result = await fetch(parsed.href, options)
  if (result.ok === true) {
    const resultJSON = await result.json()
    cleanedResult = asV2ApiResponse(resultJSON)
  } else {
    throw new Error('getInfoInner failed')
  }

  const { blockbook, backend } = cleanedResult
  // const name = cleanedResult.blockbook.coin
  // const bestHeight = cleanedResult.blockbook.bestHeight
  // const bestHash = cleanedResult.backend.bestBlockHash

  if (lastResponse.bestHeight < 0) {
    lastResponse.name = blockbook.coin
    lastResponse.decimals = blockbook.decimals
    lastResponse.version = blockbook.version
    lastResponse.backend = {
      version: backend.version,
      subversion: backend.subversion
    }
  }

  if (lastResponse.bestHeight !== blockbook.bestHeight) {
    lastResponse.bestHeight = blockbook.bestHeight
    lastResponse.bestHash = backend.bestBlockHash

    pinoLogger.info(
      `New blockHeight ${lastResponse.bestHeight} ${lastResponse.bestHash}`
    )
    const out = { ...lastResponse }
    cb(out)
  }
}

export const getInfoEngine = (cb: GetInfoEngineParams): void => {
  getInfoInner(cb)
    .catch(e => {
      pinoLogger.error(e)
    })
    .finally(() => {
      setTimeout(() => {
        getInfoEngine(cb)
      }, 10000)
    })
}
