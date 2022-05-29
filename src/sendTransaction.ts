import { asObject, asString } from 'cleaners'
import fetch from 'node-fetch'
import parse from 'url-parse'

import { config } from './config'
import { JsonRpc, JsonRpcResponse, WrapperIo } from './types'

const asSendTransactionParams = asObject({
  hex: asString
})

// const asSendTransactionResponse = asObject({
//   result: asString
// })
const server = config.blockbookServer

export type GetTransactionParams = ReturnType<typeof asSendTransactionParams>

export const sendTransaction = async (
  io: WrapperIo,
  data: JsonRpc
): Promise<JsonRpcResponse> => {
  const params = asSendTransactionParams(data.params)
  const { hex } = params

  const parsed = parse(server, true)
  parsed.set('pathname', `api/v2/sendtx/${hex}`)

  const headers = {
    'api-key': config.nowNodesApiKey
  }
  const options = { method: 'GET', headers: headers }

  let resultJSON
  const result = await fetch(parsed.href, options)
  if (result.ok === true) {
    resultJSON = await result.json()
  } else {
    throw new Error('sendTransaction failed')
  }
  const out: JsonRpcResponse = {
    id: data.id,
    data: resultJSON
  }
  return out
}
