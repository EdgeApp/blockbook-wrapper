import { asNumber, asObject } from 'cleaners'
import fetch from 'node-fetch'
import parse from 'url-parse'

import { config } from './config'
import { JsonRpc, JsonRpcResponse, WrapperIo } from './types'
// import { cleanObject } from './util'

const asV2ApiResponse = asObject({
  blockbook: asObject({
    bestHeight: asNumber
  })
})

const server = config.blockbookServer

// export type GetAccountInfoParams = ReturnType<typeof asGetAccountInfoParams>

export const getInfo = async (
  io: WrapperIo,
  data: JsonRpc
): Promise<JsonRpcResponse> => {
  const parsed = parse(server, true)
  parsed.set('pathname', `api/v2`)

  const headers = {
    'api-key': config.nowNodesApiKey
  }
  const options = { method: 'GET', headers: headers }

  let cleanedResult
  const result = await fetch(parsed.href, options)
  if (result.ok === true) {
    const resultJSON = await result.json()
    cleanedResult = asV2ApiResponse(resultJSON)
  } else {
    throw new Error('getInfo failed')
  }
  const dataOut = { bestHeight: cleanedResult.blockbook.bestHeight }
  const out: JsonRpcResponse = {
    id: data.id,
    data: dataOut
  }
  return out
}
