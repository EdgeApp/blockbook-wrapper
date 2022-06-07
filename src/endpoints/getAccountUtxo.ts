import { asBoolean, asObject, asOptional, asString } from 'cleaners'
import fetch from 'node-fetch'
import parse from 'url-parse'

import { config } from '../config'
import { JsonRpc, JsonRpcResponse, WrapperIo } from '../types'
import { cleanObject } from '../util/cleanObject'

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
  io.logger.debug('getAccountUtxo href:', parsed.href)

  const headers = {
    'api-key': config.nowNodesApiKey
  }
  const options = { method: 'GET', headers: headers }

  let resultJSON
  let result
  try {
    result = await fetch(parsed.href, options)
  } catch (e) {
    io.logger.error(e)
    throw e
  }
  if (result.ok === true) {
    resultJSON = await result.json()
    io.logger.debug({ msg: 'getAccountUtxo results', resultJSON })
  } else {
    const r = await result.text()
    io.logger.info(r)
    throw new Error('getAccountUtxo failed')
  }
  const out: JsonRpcResponse = {
    id: data.id,
    data: resultJSON
  }
  return out
}
