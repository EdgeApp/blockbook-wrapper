import { asArray, asObject, asString } from 'cleaners'
import fetch from 'node-fetch'
import parse from 'url-parse'

import { config } from './config'
import { lastResponse } from './getInfo'
import {
  asGetAccountInfo,
  GetAccountInfo,
  JsonRpc,
  SubscribeAddressResponse,
  UnsubscribeFunc,
  WrapperIo
} from './types'
import { snooze } from './util'
import { randomElement } from './util/randomElement'

export const asSubscribeAddressesParams = asObject({
  addresses: asArray(asString)
})

const server = config.blockbookServer

export type SubscribeAddressesParams = ReturnType<
  typeof asSubscribeAddressesParams
>

const ADDRESS_QUERY_SIZE = 10

const queryAddress = async (
  io: WrapperIo,
  address: string,
  from: number
): Promise<GetAccountInfo | void> => {
  const queryParams = { details: 'txs', page: 0, pageSize: 100, from }
  const parsed = parse(server, true)
  parsed.set('pathname', `api/v2/address/${address}`)
  parsed.set('query', queryParams)

  const headers = {
    'api-key': randomElement(config.nowNodesApiKeys)
  }
  const options = { method: 'GET', headers: headers }

  let resultJSON: GetAccountInfo
  // io.logger(`queryAddress ${address} ${from.toString()}`)
  const result = await fetch(parsed.href, options).catch(error => ({
    ok: false,
    error
  }))
  if (result.ok === true) {
    try {
      const r = await result.json()
      resultJSON = asGetAccountInfo(r)
    } catch (err) {
      // io.logger(`queryAddress ERROR ${address} ${err}`)
      return
    }
  } else {
    // io.logger(`queryAddress FAIL ${address} ${result.error}`)
    return
  }
  // io.logger(
  //   `queryAddress SUCCESS ${address} ${JSON.stringify(resultJSON).slice(0, 30)}`
  // )
  return resultJSON
}

export const subscribeAddressesEngine = (
  io: WrapperIo,
  data: JsonRpc
): UnsubscribeFunc => {
  let stop = false
  const id = data.id
  const { addresses } = asSubscribeAddressesParams(data.params)

  const looper = async (): Promise<void> => {
    let doStop = false // TS Hack
    while (!doStop) {
      const blockHeight = lastResponse.bestHeight - 1
      if (blockHeight < 0) {
        await snooze(5000)
        continue
      }
      let promiseArray: Array<Promise<GetAccountInfo | void>> = []
      for (let i = 0; i < addresses.length; i++) {
        const address = addresses[i]
        if ((doStop = stop)) return
        promiseArray.push(queryAddress(io, address, blockHeight))
        if (
          promiseArray.length > ADDRESS_QUERY_SIZE ||
          i === addresses.length - 1
        ) {
          const results = await Promise.all(promiseArray)
          for (const r of results) {
            if ((doStop = stop)) return
            if (r == null || r.transactions == null) continue
            for (const tx of r.transactions) {
              if ((doStop = stop)) return
              const dataField: SubscribeAddressResponse = {
                address: r.address,
                tx
              }
              const out = { id, data: dataField }
              io.logger(
                `subscribeAddresses New tx at ${blockHeight.toString()} ${address} ${
                  tx.txid
                }`
              )
              io.sendWs(out)
            }
          }
          promiseArray = []
        }
      }

      await snooze(5000)
      doStop = stop
    }
  }
  looper().catch(e => io.logger(e))

  return () => {
    stop = true
  }
}
