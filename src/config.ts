import { makeConfig } from 'cleaner-config'
import { asNumber, asObject, asOptional, asString } from 'cleaners'

const asConfig = asObject({
  blockbookServer: asOptional(asString, 'https://bsv.nownodes.io'),
  nowNodesApiKey: asOptional(asString, 'xxx'),
  shortcut: asOptional(asString, ''),
  wsPort: asOptional(asNumber, 8008)
})

export const config = makeConfig(asConfig, 'config.json')
