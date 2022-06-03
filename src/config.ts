import { makeConfig } from 'cleaner-config'
import { asArray, asNumber, asObject, asOptional, asString } from 'cleaners'

const asConfig = asObject({
  blockbookServer: asOptional(asString, 'https://bsv.nownodes.io'),
  nowNodesApiKeys: asOptional(asArray(asString), []),
  shortcut: asOptional(asString, ''),
  wsPort: asOptional(asNumber, 8008)
})

export const config = makeConfig(asConfig, 'config.json')
