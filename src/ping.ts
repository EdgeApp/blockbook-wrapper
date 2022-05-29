import { JsonRpc, JsonRpcResponse, WrapperIo } from './types'
import { snooze } from './util'

export const ping = async (
  io: WrapperIo,
  data: JsonRpc
): Promise<JsonRpcResponse> => {
  await snooze(1) // Typescript hack
  const out: JsonRpcResponse = {
    id: data.id,
    data: {}
  }
  return out
}
