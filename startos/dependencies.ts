import type { autoconfig as knotsAutoconfig } from 'knots-blake2b-startos/startos/actions/config/autoconfig'
import { configJson } from './fileModels/mempool-config.json'
import { i18n } from './i18n'
import {
  electrsDescription,
  lndDescription,
  nodeDescription,
} from './manifest/i18n'
import { sdk } from './sdk'
import { indexerId, lightningId, nodeId, settled } from './utils'

// The node's Auto-Configure action, typed from its package. Only the id is used
// at runtime; importing the action itself would bundle that package's native
// disk-usage module, built for the packing host's architecture.
const autoconfig = { id: 'autoconfig' } as unknown as typeof knotsAutoconfig

// Unlike Mempool Pruned, this fork looks confirmed transactions up with
// `getrawtransaction` and no block hash, which only a node with txindex answers,
// and txindex cannot run on a pruned node.
const node = sdk.Dependency.required(nodeId, {
  description: nodeDescription,
  metadata: {
    title: 'Bitcoin Knots (BLAKE2b) Companion',
    icon: 'https://raw.githubusercontent.com/paulscode/knots-blake2b-startos/main/dep-icon.png',
  },
  kind: 'running',
  // 29.4.3 is the release that follows the chain past block 979919.
  versionRange: '>=29.4.3:0',
  // `chain` fails while the node is below the BLAKE2b activation height.
  healthChecks: ['node', 'chain'],
}).withInit(async (effects) => {
  await sdk.action.createTask(effects, nodeId, autoconfig, 'critical', {
    input: {
      kind: 'partial',
      accept: [{ prune: 0, txindex: true }],
      set: { prune: 0, txindex: true },
    },
    when: { condition: 'input-not-matches', once: false },
    reason: i18n(
      'Mempool Kilombino needs a full (unpruned) node with the transaction index on',
    ),
  })
})

const electrsPruned = sdk.Dependency.required(indexerId, {
  description: electrsDescription,
  metadata: {
    title: 'Electrs Pruned',
    icon: 'https://raw.githubusercontent.com/paulscode/electrs-pruned-startos/master/dep-icon.png',
  },
  kind: 'running',
  // 0.11.1:48 keeps indexing past the chain split under Knots 29.4.3.
  versionRange: '>=0.11.1:48',
  healthChecks: ['electrs', 'sync'],
})

// Lightning Fork's `chain-identity` check confirms its node is on the BLAKE2b chain.
const lightningFork = sdk.Dependency.optional(lightningId, {
  description: lndDescription,
  metadata: {
    title: 'Lightning Fork',
    icon: 'https://raw.githubusercontent.com/paulscode/lightning-fork-startos/master/icon.png',
  },
  kind: 'running',
  versionRange: '>=0.21.3-beta.16:0',
  healthChecks: ['lnd', 'sync-progress', 'chain-identity'],
  enabled: async ({ effects }) =>
    !!(await settled(() =>
      configJson.read((c) => c.LIGHTNING.ENABLED).const(effects),
    )),
})

export const dependencies = sdk.Dependencies.of()
  .addDependency(node)
  .addDependency(electrsPruned)
  .addDependency(lightningFork)
