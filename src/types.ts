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
  [methodName: string]: {
    handler: (...args) => Promise<JsonRpcResponse>
  }
}

export interface WrapperIo {
  logger: (...args) => void
  ws: WebSocket
}

export interface WsConnection {
  addrPort: string
  initWs: () => void
  stopWs: () => void
}