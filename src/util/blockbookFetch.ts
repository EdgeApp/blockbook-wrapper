import fetch from 'node-fetch'

import { config } from '../config'
import { WrapperIo } from '../types'

export type BlockbookResponse =
  | {
      data: Object
    }
  | {
      error: {
        message: string
      }
    }

export const blockbookFetch = async (
  io: WrapperIo,
  href: string
): Promise<BlockbookResponse> => {
  io.logger.debug({ msg: 'blockbookFetch request', href })

  const headers = {
    'api-key': config.nowNodesApiKey
  }
  const options = { method: 'GET', headers: headers }
  const response = await fetch(href, options)
  const responseJson = await response.json().catch(async err => {
    const responseText = await response.text()
    io.logger.error({
      err,
      where: 'blockbookFetch JSON parse error',
      responText: responseText
    })
    return {
      error: 'Failed to parse JSON from wrapped blockbook server'
    }
  })

  let bbResponse: BlockbookResponse

  if (responseJson.error != null) {
    bbResponse = {
      error: {
        message: responseJson.error
      }
    }
  }

  bbResponse = {
    data: responseJson
  }

  io.logger.debug({
    msg: 'blockbookFetch response',
    href,
    response: bbResponse
  })

  return bbResponse
}
