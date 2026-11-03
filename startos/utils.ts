import { T, utils } from '@start9labs/start-sdk'
import { totalmem } from 'os'
import { controlHostId, restPort } from 'lnd-startos/startos/interfaces'
import {
  rpcHostId as knotsRpcHostId,
  rpcPort as knotsRpcPort,
} from 'knots-blake2b-startos/startos/utils'
import { sdk } from './sdk'

/**
 * A `.const` read of mempool-config.json, which an action may be writing at
 * that moment. A parse failure is read again shortly; anything else is thrown.
 */
export async function settled<A>(read: () => Promise<A>): Promise<A> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await read()
    } catch (e) {
      if ((e as Error)?.name !== 'SyntaxError' || attempt >= 20) throw e
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }
}

export const randomPassword = {
  charset: 'a-z,A-Z,1-9',
  len: 22,
}

export function getDbPassword(): string {
  return utils.getDefaultString(randomPassword)
}

export const uiPort = 8080
export const mainHostId = 'main'
export const apiPort = 8999
export const nodesMapPort = 3110
export const btcMountpoint = '/mnt/bitcoind'
export const lndMountpoint = '/mnt/lnd'

/** The node this explorer reads: Knots (BLAKE2b) Companion. */
export const nodeId = 'knots-blake2b'
/** Lightning Fork: LND on the BLAKE2b chain, same API and volume layout as LND. */
export const lightningId = 'lightning-fork'
/** The Electrum server for address lookups. */
export const indexerId = 'electrs-pruned'

export const lndCertPath = `${lndMountpoint}/tls.cert`
export const lndMacaroonPath = `${lndMountpoint}/data/chain/bitcoin/mainnet/readonly.macaroon`

// The node's RPC cookie. Knots (BLAKE2b) Companion runs mainnet only, which keeps
// its cookie at the volume root.
export const cookiePath = `${btcMountpoint}/.cookie`

/** A bridge address is always `<ipv4>:<port>`; split it into a HOST/PORT pair. */
export const hostPort = (addr: string) => {
  const i = addr.lastIndexOf(':')
  return { HOST: addr.slice(0, i), PORT: Number(addr.slice(i + 1)) }
}

// Our fork's mining-pool list, which tags the BLAKE2b chain's miners. Read from
// GitHub and checked hourly, as on mempool.kilombino.com.
export const poolsJsonUrl =
  'https://raw.githubusercontent.com/Kilombino/mempool-bip110/main/pools-v2.json'
export const poolsTreeUrl =
  'https://api.github.com/repos/Kilombino/mempool-bip110/git/trees/main'

// The BLAKE2b chain's maximum block weight.
export const blockWeightUnits = 800000

export const EXTERNAL_RETRY = {
  EXTERNAL_MAX_RETRY: 3,
  EXTERNAL_RETRY_INTERVAL: 5,
}

/** The node's RPC bridge address (`<ip>:18443`), `null` while it is absent. */
export const nodeRpcBridge = (effects: T.Effects) =>
  sdk.host
    .getBridgeAddress(effects, {
      packageId: nodeId,
      hostId: knotsRpcHostId,
      internalPort: knotsRpcPort,
      ssl: false,
    })
    .const()

/** Electrs Pruned's plaintext Electrum bridge address, `null` while absent. */
export const electrumBridge = (effects: T.Effects) =>
  sdk.host
    .getBridgeAddress(effects, {
      packageId: indexerId,
      hostId: 'electrum',
      internalPort: 50001,
      ssl: false,
    })
    .const()

/** Lightning Fork's REST bridge address, `null` until its wallet is unlocked. */
export const lndRestBridge = (effects: T.Effects) =>
  sdk.host
    .getBridgeAddress(effects, {
      packageId: lightningId,
      hostId: controlHostId,
      internalPort: restPort,
    })
    .const()

// Performance profile presets. POLL_RATE_MS is the main-loop period;
// MEMPOOL_BLOCKS_AMOUNT is the depth of the Rust GBT projection.
export type PerformanceProfile = 'low-cpu' | 'balanced' | 'responsive'

export const PROFILES: Record<
  PerformanceProfile,
  { POLL_RATE_MS: number; MEMPOOL_BLOCKS_AMOUNT: number }
> = {
  'low-cpu': { POLL_RATE_MS: 8000, MEMPOOL_BLOCKS_AMOUNT: 4 },
  balanced: { POLL_RATE_MS: 4000, MEMPOOL_BLOCKS_AMOUNT: 6 },
  responsive: { POLL_RATE_MS: 2000, MEMPOOL_BLOCKS_AMOUNT: 8 },
}

export const DEFAULT_PROFILE: PerformanceProfile = 'low-cpu'

// totalmem() is the service-container share, 1 GiB below the host's MemTotal.
export const LOW_RAM_BYTES = 12 * 1024 ** 3

export const isLowRam = () => totalmem() < LOW_RAM_BYTES
