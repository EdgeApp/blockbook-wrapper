import { asBoolean, asObject, asOptional, asString } from 'cleaners'
import fetch from 'node-fetch'
import parse from 'url-parse'

import { config } from './config'
import { JsonRpc, JsonRpcResponse, WrapperIo } from './types'
import { cleanObject } from './util'

export const asGetAccountInfoParams = asObject({
  descriptor: asString,
  confirmed: asOptional(asBoolean)
  // details: asOptional(asString),
  // page: asOptional(asNumber),
  // pageSize: asOptional(asNumber)
})

const server = config.blockbookServer

export type GetAccountInfoParams = ReturnType<typeof asGetAccountInfoParams>

export const getAccountUtxo = async (
  io: WrapperIo,
  data: JsonRpc
): Promise<JsonRpcResponse> => {
  const params = asGetAccountInfoParams(data.params)
  const { descriptor: address, confirmed } = params

  const queryParams = { confirmed }

  cleanObject(queryParams)

  const parsed = parse(server, true)
  parsed.set('pathname', `api/v2/utxo/${address}`)
  parsed.set('query', queryParams)
  // io.logger('getAccountUtxo href:', parsed.href)

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
    throw new Error('getAccountUtxo failed')
  }
  const out: JsonRpcResponse = {
    id: data.id,
    data: resultJSON
  }
  return out
}
