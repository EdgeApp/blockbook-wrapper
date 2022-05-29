import { asObject, asString } from 'cleaners'
import fetch from 'node-fetch'
import parse from 'url-parse'

import { JsonRpc, JsonRpcResponse, WrapperIo } from './types'
import { cleanObject } from './util'

export const asGetTransactionParams = asObject({
  txid: asString
})

const server = 'https://btc1.trezor.io'

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
    // 'x-api-key': apiKey
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
