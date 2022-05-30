import { asObject, asString, asUnknown } from 'cleaners'

export const asJsonRpc = asObject({
  id: asString,
  method: asString,
  params: asUnknown
})
export type JsonRpc = ReturnType<typeof asJsonRpc>
export interface JsonRpcResponse {
  id: string
  data: Object
}
export interface MethodMap {
  [methodName: string]: (...args) => Promise<JsonRpcResponse>
}

export interface WrapperIo {
  logger: (...args) => void
  ws: WebSocket
}

const asGetInfoResponse = asObject({
  name: asString,
  shortcut: asString,
  decimals: asNumber,
  version: asString,
  bestHeight: asNumber,
  bestHash: asString,
  block0Hash: asString,
  testnet: asBoolean,
  backend: asOptional(
    asObject({
      version: asString,
      subversion: asString
    })
  )
})

export type GetInfoResponse = ReturnType<typeof asGetInfoResponse>
export interface WsConnection {
  addrPort: string
  initWs: () => void
  stopWs: () => void
  updateBlockHeight: (param: GetInfoResponse) => void
}

export type GetInfoEngineParams = (response: GetInfoResponse) => void
