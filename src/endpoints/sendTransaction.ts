import { asObject, asString } from 'cleaners'
import fetch from 'node-fetch'
import parse from 'url-parse'

import { config } from '../config'
import { JsonRpc, JsonRpcResponse, WrapperIo } from '../types'

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

  const response = await fetch(parsed.href, options)

  const responseJson = await response.json().catch(async err => {
    const responseText = await response.text()
    io.logger.error({
      err,
      where: 'sendTransaction JSON parse error',
      responText: responseText
    })
    return {
      error: 'Failed to parse JSON from wrapped blockbook server'
    }
  })

  if (responseJson.error != null) {
    return {
      id: data.id,
      error: {
        message: responseJson.error
      }
    }
  }

  const out: JsonRpcResponse = {
    id: data.id,
    data: responseJson
  }
  return out
}
