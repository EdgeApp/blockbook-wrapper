import { asObject, asString } from 'cleaners'
import fetch from 'node-fetch'
import parse from 'url-parse'

import { config } from './config'
import { JsonRpc, JsonRpcResponse, WrapperIo } from './types'

export const asGetTransactionParams = asObject({
  txid: asString
})

const server = config.blockbookServer

export type GetTransactionParams = ReturnType<typeof asGetTransactionParams>

export const getTransaction = async (
  io: WrapperIo,
  data: JsonRpc
): Promise<JsonRpcResponse> => {
  const params = asGetTransactionParams(data.params)
  const { txid } = params

  const parsed = parse(server, true)
  parsed.set('pathname', `api/v2/tx/${txid}`)

  const headers = {
    'api-key': config.nowNodesApiKey
  }
  const options = { method: 'GET', headers: headers }

  let resultJSON
  const result = await fetch(parsed.href, options)
  if (result.ok === true) {
    resultJSON = await result.json()
    io.logger.debug({ msg: 'getTransaction results', resultJSON })
  } else {
    throw new Error('getAccountInfo failed')
  }
  const out: JsonRpcResponse = {
    id: data.id,
    data: resultJSON
  }
  return out
}
