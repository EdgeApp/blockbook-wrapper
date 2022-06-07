import { asArray, asObject, asString } from 'cleaners'
import parse from 'url-parse'

import { config } from '../config'
import {
  asGetAccountInfo,
  GetAccountInfo,
  JsonRpc,
  SubscribeAddressResponse,
  UnsubscribeFunc,
  WrapperIo
} from '../types'
import { blockbookFetch } from '../util/blockbookFetch'
import { snooze } from '../util/snooze'
import { lastResponse } from './getInfo'

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
  const response = await blockbookFetch(io, parsed.href)

  let resultJSON: GetAccountInfo
  io.logger.info({ msg: 'address query init', address, from })

  if ('error' in response) {
    io.logger.warn({
      msg: 'queryAddress failed blockbookFetch',
      response,
      address
    })
    return
  }

  try {
    resultJSON = asGetAccountInfo(response.data)
  } catch (err) {
    io.logger.error({
      err,
      where: 'queryAddress response parsing',
      address
    })
    return
  }

  io.logger.info({ msg: 'address query success', address, resultJSON })
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
              io.logger.info({
                msg: 'subscribeAddresses new tx',
                blockHeight,
                address
              })
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
  looper().catch(err =>
    io.logger.error({ err, where: 'subscribeAddressesEngine looper crash' })
  )

  return () => {
    stop = true
  }
}
