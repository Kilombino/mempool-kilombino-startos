import { configJson } from '../fileModels/mempool-config.json'
import { sdk } from '../sdk'
import {
  electrumBridge,
  hostPort,
  lndRestBridge,
  nodeRpcBridge,
  settled,
} from '../utils'

/**
 * Pins the node's, Electrs Pruned's and (with Lightning on) Lightning Fork's
 * bridge addresses into mempool-config.json. Each read is reactive, so this
 * re-runs, and main restarts the backend, only when an address changes. An
 * absent dependency is left out rather than written as a fake address, and
 * `MEMPOOL.BACKEND` follows whether Electrum resolved.
 */
export const watchHosts = sdk.setupOnInit(async (effects, _) => {
  const lightning = await settled(() =>
    configJson.read((c) => c.LIGHTNING).const(effects),
  )
  const node = await nodeRpcBridge(effects)
  const electrum = await electrumBridge(effects)
  const lndRest = lightning?.ENABLED ? await lndRestBridge(effects) : null

  await configJson.merge(
    effects,
    {
      ...(node && { CORE_RPC: hostPort(node) }),
      MEMPOOL: { BACKEND: electrum ? 'electrum' : 'none' },
      ...(electrum && {
        ELECTRUM: { ...hostPort(electrum), TLS_ENABLED: false },
      }),
      ...(lndRest && { LND: { REST_API_URL: `https://${lndRest}` } }),
    },
    { allowWriteAfterConst: true },
  )
})
