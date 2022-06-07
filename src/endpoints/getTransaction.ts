import { asObject, asString } from 'cleaners'
import parse from 'url-parse'

import { config } from '../config'
import { JsonRpc, JsonRpcResponse, WrapperIo } from '../types'
import { blockbookFetch } from '../util/blockbookFetch'

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

  const response = await blockbookFetch(io, parsed.href)

  return {
    id: data.id,
    ...response
  }
}
