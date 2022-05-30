import {
  asArray,
  asBoolean,
  asNumber,
  asObject,
  asOptional,
  asString,
  asUnknown
} from 'cleaners'

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
  sendWs: (arg: Object) => void
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

export const asSubscribeAddressesParams = asObject({
  addresses: asArray(asString)
})

export type UnsubscribeFunc = () => void

export const asGetAccountTx = asObject({
  txid: asString,
  version: asNumber,
  vin: asArray(
    asObject({
      txid: asString,
      vout: asNumber,
      sequence: asNumber,
      n: asNumber,
      addresses: asArray(asString),
      isAddress: asBoolean,
      value: asString,
      hex: asString
    })
  ),
  vout: asArray(
    asObject({
      value: asString,
      n: asNumber,
      hex: asString,
      addresses: asArray(asString),
      isAddress: asBoolean
    })
  ),
  blockHeight: asNumber,
  confirmations: asNumber,
  blockTime: asNumber,
  value: asString,
  valueIn: asString,
  fees: asString,
  hex: asString
})

export type GetAccountTx = ReturnType<typeof asGetAccountTx>

export const asGetAccountInfo = asObject({
  page: asNumber,
  totalPages: asNumber,
  itemsOnPage: asNumber,
  address: asString,
  balance: asOptional(asString),
  totalReceived: asString,
  totalSent: asString,
  unconfirmedBalance: asString,
  unconfirmedTxs: asNumber,
  txs: asNumber,
  transactions: asOptional(asArray(asGetAccountTx))
})

export type GetAccountInfo = ReturnType<typeof asGetAccountInfo>
export interface SubscribeAddressResponse {
  address: string
  tx: GetAccountTx
}
