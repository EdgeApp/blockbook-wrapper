import { asNumber, asObject, asOptional, asString } from 'cleaners'
import fetch from 'node-fetch'
import parse from 'url-parse'

import { config } from './config'
import { JsonRpc, JsonRpcResponse, WrapperIo } from './types'
import { cleanObject } from './util'

export const asGetAccountInfoParams = asObject({
  descriptor: asString,
  details: asOptional(asString),
  page: asOptional(asNumber),
  pageSize: asOptional(asNumber)
})

const server = config.blockbookServer

export type GetAccountInfoParams = ReturnType<typeof asGetAccountInfoParams>

export const getAccountInfo = async (
  io: WrapperIo,
  data: JsonRpc
): Promise<JsonRpcResponse> => {
  const params = asGetAccountInfoParams(data.params)
  const { descriptor: address, details, page, pageSize } = params

  const queryParams = { details, page, pageSize }

  cleanObject(queryParams)

  const parsed = parse(server, true)
  parsed.set('pathname', `api/v2/address/${address}`)
  parsed.set('query', queryParams)
  // io.logger('getAccountInfo href:', parsed.href)

  const headers = {
    'api-key': config.nowNodesApiKey
  }
  const options = { method: 'GET', headers: headers }

  let resultJSON
  const result = await fetch(parsed.href, options)
  if (result.ok === true) {
    resultJSON = await result.json()
    // io.logger(JSON.stringify(resultJSON, null, 2))
  } else {
    throw new Error('getAccountInfo failed')
  }
  const out: JsonRpcResponse = {
    id: data.id,
    data: resultJSON
  }
  return out
}
