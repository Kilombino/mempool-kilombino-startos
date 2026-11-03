import { sdk } from '../sdk'
import { enableLightning } from './enableLightning'
import { indexingAndPerformance } from './indexingAndPerformance'
import { clearBackendCache } from './clearBackendCache'

export const actions = sdk.Actions.of()
  .addAction(enableLightning)
  .addAction(indexingAndPerformance)
  .addAction(clearBackendCache)
