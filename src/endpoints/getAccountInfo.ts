import { asNumber, asObject, asOptional, asString } from 'cleaners'
import parse from 'url-parse'

import { config } from '../config'
import { JsonRpc, JsonRpcResponse, WrapperIo } from '../types'
import { blockbookFetch } from '../util/blockbookFetch'
import { cleanObject } from '../util/cleanObject'

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

  const response = await blockbookFetch(io, parsed.href)

  return {
    id: data.id,
    ...response
  }
}
