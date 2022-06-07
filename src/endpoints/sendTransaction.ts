import { asObject, asString } from 'cleaners'
import parse from 'url-parse'

import { config } from '../config'
import { JsonRpc, JsonRpcResponse, WrapperIo } from '../types'
import { blockbookFetch } from '../util/blockbookFetch'

const server = config.blockbookServer
const asSendTransactionParams = asObject({
  hex: asString
})

export type GetTransactionParams = ReturnType<typeof asSendTransactionParams>

export const sendTransaction = async (
  io: WrapperIo,
  data: JsonRpc
): Promise<JsonRpcResponse> => {
  const params = asSendTransactionParams(data.params)
  const { hex } = params
  const parsed = parse(server, true)
  parsed.set('pathname', `api/v2/sendtx/${hex}`)

  const response = await blockbookFetch(io, parsed.href)

  return {
    id: data.id,
    ...response
  }
}
