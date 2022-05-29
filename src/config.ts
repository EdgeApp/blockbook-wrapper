import { asNumber, asObject, asString } from 'cleaners'

import c from '../config.json'

const asWrapperConfig = asObject({
  blockbookServer: asString,
  nowNodesApiKey: asString,
  wsPort: asNumber
})

export const config = asWrapperConfig(c)
