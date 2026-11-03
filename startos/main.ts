import { lookup } from 'dns/promises'
import { totalmem } from 'os'
import type { manifest as knotsManifest } from 'knots-blake2b-startos/startos/manifest'
import type { manifest as lndManifest } from 'lnd-startos/startos/manifest'
import { configJson } from './fileModels/mempool-config.json'
import { i18n } from './i18n'
import { sdk } from './sdk'
import {
  apiPort,
  btcMountpoint,
  cookiePath,
  lightningId,
  lndMountpoint,
  nodeId,
  nodeRpcBridge,
  nodesMapPort,
  settled,
  uiPort,
} from './utils'

// Absolute mountpoint of the backend disk-cache volume (see backendMounts).
const BACKEND_CACHE_DIR = '/backend/cache'
// Written when the backend starts, removed by the api health check on first
// success. Still present at the next start means the previous start never became
// healthy, so the cache is dropped in case reloading it is what kills the
// backend. Any crash loop leaves the same sentinel, so the guard cannot know
// why — the message must not name a cause it did not observe (issue #75).
const BOOT_SENTINEL = `${BACKEND_CACHE_DIR}/.starting`
const BOOT_GUARD_CMD: [string, ...string[]] = [
  '/bin/sh',
  '-c',
  [
    `if [ -e "${BOOT_SENTINEL}" ]; then`,
    `rm -f "${BOOT_SENTINEL}";`,
    `if [ -n "$(ls -A "${BACKEND_CACHE_DIR}" 2>/dev/null)" ]; then`,
    `echo "mempool: the previous start never became ready; clearing the backend disk cache before retrying" >&2;`,
    `rm -rf "${BACKEND_CACHE_DIR}"/* "${BACKEND_CACHE_DIR}"/.[!.]* 2>/dev/null || true;`,
    `fi;`,
    `fi;`,
    `: > "${BOOT_SENTINEL}";`,
    `exec node /backend/package/index.js`,
  ].join(' '),
]

export const main = sdk.setupMain(async ({ effects }) => {
  /**
   * ======================== Setup ========================
   */
  console.info(i18n('Starting Mempool'))

  // ========================
  // Dependency setup & checks
  // ========================

  const config = await settled(() => configJson.read().const(effects))
  if (!config) throw new Error('Config file not found')

  // V8 old-space heap ceiling for the mempool backend, scaled to the RAM
  // StartOS grants service containers (host MemTotal less its own 1 GiB reserve).
  // This is a ceiling, not a reservation: the backend's steady-state heap sits
  // well under it, so raising it does not grow normal RAM use — it only lets a
  // transient startup peak (reloading the on-disk mempool/RBF cache) finish
  // instead of self-OOMing. An earlier version pinned this at 2 GB for every
  // host up to ~22 GB RAM (the /8 share never cleared the 2 GB floor), so a
  // 16 GB host whose cache needed >2 GB to reload crashed with "JavaScript heap
  // out of memory" on every start (start-os#3326). Reserve 6 GB for the
  // co-resident stack (Bitcoin, the Electrum indexer, any Lightning node —
  // StartOS already withheld its own share before totalmem() reported this)
  // and share the remainder: 1/3 with indexing off (2 GB floor),
  // 1/2 with any indexing toggle on (4 GB floor, heavier working set). A cache
  // too large to reload even under this ceiling is handled by the boot guard on
  // the api daemon, which drops it and rebuilds from live data.
  const RESERVED_MB = 6 * 1024
  const totalMB = Math.floor(totalmem() / (1024 * 1024))
  const effectiveMB = Math.max(0, totalMB - RESERVED_MB)
  const anyIndexing =
    config.MEMPOOL.BLOCKS_SUMMARIES_INDEXING ||
    config.MEMPOOL.GOGGLES_INDEXING ||
    config.MEMPOOL.AUDIT ||
    config.MEMPOOL.CPFP_INDEXING
  const backendMaxOldSpaceMB = anyIndexing
    ? Math.max(4096, Math.min(8192, Math.floor(effectiveMB / 2)))
    : Math.max(2048, Math.min(8192, Math.floor(effectiveMB / 3)))

  // Issue #63: the block-summaries / goggles / CPFP backfill logs per-block
  // progress at debug priority only, so at the default 'info' level the
  // service log appears completely idle for the many hours a backfill runs —
  // operators mistake it for a stalled sync and restart the service, which
  // interrupts the backfill. Announce the state at every start so someone
  // following the log knows a backfill may be in progress, that 503 retries
  // are non-fatal, and how to surface per-block progress.
  if (anyIndexing) {
    console.info(
      i18n(
        'Indexing is enabled. If a historical backfill is still incomplete it will resume now and may run for many hours. Intermittent 503 retry errors from Bitcoin during the backfill are expected and non-fatal. Avoid restarting the service — restarts interrupt the backfill and delay completion.',
      ),
    )
    if (config.MEMPOOL.STDOUT_LOG_MIN_PRIORITY !== 'debug') {
      console.info(
        i18n(
          'Backfill progress is logged at debug priority and is hidden at the current log level, so the log may appear idle while indexing runs. To watch per-block progress, set Log Level to Debug in the Indexing and Performance action.',
        ),
      )
    }
  }

  // Mempool runs entirely on addresses — Bitcoin and the indexer over the bridge,
  // MariaDB over loopback — so a container with no resolver still serves blocks
  // and still serves the UI. Fiat prices and the external data server do not, and
  // those failures surface far from their cause, which is usually the server's
  // rather than ours (start-technologies#3603).
  const resolves = await Promise.race([
    lookup('mempool.space').then(
      () => true,
      () => false,
    ),
    new Promise<boolean>((resolve) => setTimeout(resolve, 5_000, false)),
  ])
  if (!resolves) {
    console.warn(
      i18n(
        'This server could not resolve an external hostname. Mempool is otherwise unaffected — Bitcoin, the Electrum indexer, and the database are reached by address — but fiat exchange rates will be unavailable. Set explicit DNS servers under System > DNS on your server, and check any VPN or StartTunnel gateway you have configured: a gateway supplies its own resolver, which stops working whenever the tunnel does.',
      ),
    )
  }

  let backendMounts = sdk.Mounts.of()
    .mountVolume({
      volumeId: 'cache',
      subpath: null,
      mountpoint: '/backend/cache',
      readonly: false,
    })
    .mountVolume({
      volumeId: 'config',
      subpath: 'mempool-config.json',
      mountpoint: '/backend/mempool-config.json',
      readonly: true,
      type: 'file',
    })
    .mountDependency<typeof knotsManifest>({
      // Read-only, for the RPC cookie.
      dependencyId: nodeId,
      volumeId: 'main',
      subpath: null,
      mountpoint: btcMountpoint,
      readonly: true,
    })

  if (config.LIGHTNING.ENABLED) {
    backendMounts = backendMounts.mountDependency<typeof lndManifest>({
      // Lightning Fork's volume is laid out as LND's.
      dependencyId: lightningId as 'lnd',
      volumeId: 'main',
      subpath: null,
      mountpoint: lndMountpoint,
      readonly: true,
    })
  }

  // ========================
  // Set containers
  // ========================

  const backendSub = sdk.SubContainer.of(
    effects,
    { imageId: 'backend' },
    backendMounts,
    'backend-api',
  )

  const frontendSub = sdk.SubContainer.of(
    effects,
    { imageId: 'frontend' },
    null,
    'user-interface',
  )

  // Bitcoin Nodes World Map: crawls the node's known peers hourly and serves the
  // page the dashboard embeds, at /nodes-map/ through the frontend's nginx.
  const nodesMapSub = sdk.SubContainer.of(
    effects,
    { imageId: 'nodes-map' },
    sdk.Mounts.of()
      .mountVolume({
        volumeId: 'nodesmap',
        subpath: null,
        mountpoint: '/data',
        readonly: false,
      })
      .mountDependency<typeof knotsManifest>({
        dependencyId: nodeId,
        volumeId: 'main',
        subpath: null,
        mountpoint: btcMountpoint,
        readonly: true,
      }),
    'nodes-map',
  )
  const nodeRpc = await nodeRpcBridge(effects)

  const mariaSub = sdk.SubContainer.of(
    effects,
    { imageId: 'mariadb' },
    sdk.Mounts.of().mountVolume({
      volumeId: 'db',
      subpath: null,
      mountpoint: '/var/lib/mysql',
      readonly: false,
    }),
    'mariadb-sub',
  )

  /**
   *  ======================== Daemons ========================
   */
  // Flipped true once the api health check first sees the port listening; gates
  // the one-time removal of the boot sentinel (see the api daemon below).
  let bootSentinelCleared = false

  return sdk.Daemons.of(effects)
    .addDaemon('mariadb', {
      subcontainer: mariaSub,
      exec: {
        command: sdk.useEntrypoint(['--bind-address=127.0.0.1']),
        env: {
          MARIADB_RANDOM_ROOT_PASSWORD: '1',
          MYSQL_DATABASE: config.DATABASE.DATABASE,
          MYSQL_USER: config.DATABASE.USERNAME,
          MYSQL_PASSWORD: config.DATABASE.PASSWORD,
        },
      },
      ready: {
        gracePeriod: 120_000,
        display: null,
        fn: async () => {
          const res = await mariaSub.exec([
            'healthcheck.sh',
            '--connect',
            '--innodb_initialized',
          ])

          if (res.exitCode !== 0) {
            return {
              result: 'starting',
              message: null,
            }
          }
          return {
            result: 'success',
            message: null,
          }
        },
      },
      requires: [],
    })
    .addDaemon('api', {
      subcontainer: backendSub,
      exec: {
        command: BOOT_GUARD_CMD,
        user: 'root',
        env: {
          NODE_OPTIONS: `--max-old-space-size=${backendMaxOldSpaceMB}`,
        },
      },
      ready: {
        gracePeriod: 45_000,
        display: i18n('API'),
        fn: async () => {
          const res = await sdk.healthCheck.checkPortListening(
            effects,
            apiPort,
            {
              successMessage: i18n('The API is ready'),
              errorMessage: i18n('The API is not ready'),
            },
          )
          // On the first healthy report, clear the boot sentinel so a later
          // clean restart is not mistaken for a failed boot. If the backend
          // never reaches this point (e.g. an OOM boot loop), the sentinel
          // persists and the guard drops the cache on the next start.
          if (res.result === 'success' && !bootSentinelCleared) {
            bootSentinelCleared = true
            const rm = await backendSub
              .exec(['rm', '-f', BOOT_SENTINEL], { user: 'root' })
              .catch(() => null)
            // Retry on the next poll if the removal did not land, so a stale
            // sentinel can't make a later clean restart drop the cache.
            if (!rm || rm.exitCode !== 0) bootSentinelCleared = false
          }
          return res
        },
      },
      requires: ['mariadb'],
    })
    .addDaemon('webui', {
      subcontainer: frontendSub,
      exec: {
        command: sdk.useEntrypoint(),
        env: {
          // nginx resolves a literal hostname in `proxy_pass` when it loads its
          // config, and the image ships no `resolver` directive, so its one
          // external upstream — the mempool.space accelerator — made the entire
          // UI refuse to start whenever a lookup failed (issue #69). The image's
          // own PROXIED_SERVICES rewrites that line; pointing it at our backend
          // needs no name resolution and answers a call to a disabled feature
          // with a 404 rather than a hang.
          PROXIED_SERVICES: 'true',
          PROXIED_SERVICES_HOST: `http://127.0.0.1:${apiPort}`,
          ...(config.LIGHTNING.ENABLED && { LIGHTNING: 'true' }),
          // The BLAKE2b chain's block weight; the frontend's own default is 4M.
          BLOCK_WEIGHT_UNITS: String(config.MEMPOOL.BLOCK_WEIGHT_UNITS),
          MEMPOOL_BLOCKS_AMOUNT: String(config.MEMPOOL.MEMPOOL_BLOCKS_AMOUNT),
          AUDIT: config.MEMPOOL.AUDIT ? 'true' : 'false',
          // The accelerator is mempool.space's service for the SHA256 chain.
          ACCELERATOR: 'false',
          ACCELERATOR_BUTTON: 'false',
          PUBLIC_ACCELERATIONS: 'false',
          NODES_MAP_UPSTREAM: `http://127.0.0.1:${nodesMapPort}`,
          LN_DIRECTORY_API: 'off',
        },
      },
      ready: {
        display: i18n('Web Interface'),
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, uiPort, {
            successMessage: i18n('The web interface is ready'),
            errorMessage: i18n('The web interface is not ready'),
          }),
      },
      // The frontend reverse-proxies the API/websocket to the backend and is
      // non-functional without it. Gating on 'api' makes the 'webui' health a
      // truthful "Mempool is usable" signal — StartOS holds/stops webui while
      // api isn't healthy and restarts it when api recovers — which dependents
      // (e.g. Am I Exposed) rely on.
      requires: ['api'],
    })
    .addDaemon('nodes-map', {
      subcontainer: nodesMapSub,
      exec: {
        command: sdk.useEntrypoint(),
        // The node's cookie is readable by root only.
        user: 'root',
        env: {
          NODES_MAP_DATA_DIR: '/data',
          NODES_MAP_BIND: '127.0.0.1',
          NODES_MAP_PORT: String(nodesMapPort),
          TOR_PROXY: 'none',
          BITCOIN_RPC_URL: nodeRpc ? `http://${nodeRpc}/` : '',
          BITCOIN_RPC_COOKIE: cookiePath,
        },
      },
      ready: {
        display: i18n('Nodes Map'),
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, nodesMapPort, {
            successMessage: i18n('The nodes map is ready'),
            errorMessage: i18n('The nodes map is not ready'),
          }),
      },
      requires: [],
    })
})
