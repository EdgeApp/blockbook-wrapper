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
import { makeDate, snooze } from './util'

const asV2ApiResponse = asObject({
  blockbook: asObject({
    bestHeight: asNumber
  }),
  backend: asObject({
    bestBlockHash: asString
  })
})
export type V2ApiResponse = ReturnType<typeof asV2ApiResponse>

const lastResponse: GetInfoResponse = {
  bestHeight: -1,
  bestHash: ''
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

const log = (...args): void => {
  const d = makeDate()
  console.log(`${d}`, ...args)
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
  const bestHeight = cleanedResult.blockbook.bestHeight
  const bestHash = cleanedResult.backend.bestBlockHash
  if (lastResponse.bestHeight !== bestHeight) {
    lastResponse.bestHeight = bestHeight
    lastResponse.bestHash = bestHash
    log(`New blockHeight ${bestHeight} ${bestHash}`)
    const out = { bestHeight, bestHash }
    cb(out)
  }
}

export const getInfoEngine = (cb: GetInfoEngineParams): void => {
  getInfoInner(cb)
    .catch(e => {
      log(e)
    })
    .finally(() => {
      setTimeout(() => {
        getInfoEngine(cb)
      }, 10000)
    })
}
