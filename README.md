<p align="center">
  <img src="icon.png" alt="Mempool Kilombino" width="21%">
</p>

# Mempool Kilombino on StartOS

The explorer of [mempool.kilombino.com](https://mempool.kilombino.com) for the Bitcoin BLAKE2b
chain (BTC), packaged for StartOS 0.4. It is [Kilombino/mempool-bip110](https://github.com/Kilombino/mempool-bip110),
a fork of Paul Lamb's [mempool-bip110](https://github.com/paulscode/mempool-bip110) (itself based on
Retropex's fork of [The Mempool Open Source Project®](https://github.com/mempool/mempool) 3.2.1).
The packaging is adapted from Paul Lamb's [Mempool Pruned](https://github.com/paulscode/mempool-pruned-startos)
and his retired [Mempool BIP-110](https://github.com/paulscode/mempool-bip110-startos) wrappers.

- **Upstream repo:** <https://github.com/Kilombino/mempool-bip110> (submodule `mempool/`)
- **Wrapper repo:** <https://github.com/Kilombino/mempool-kilombino-startos>
- **Package id:** `mempool-kilombino` — installs alongside `mempool` and `mempool-pruned`.

## Images and daemons

Four images; the first three are built from the submodule (see `NOTES.md`) and shared with the
Umbrel app.

| Image       | Source                                                  |
| ----------- | ------------------------------------------------------- |
| `frontend`  | `ghcr.io/kilombino/mempool-kilombino-frontend` (nginx + Angular) |
| `backend`   | `ghcr.io/kilombino/mempool-kilombino-backend` (Node + Rust GBT)  |
| `nodes-map` | `ghcr.io/kilombino/mempool-kilombino-nodes-map` (`contrib/nodes-map`) |
| `mariadb`   | `mariadb:10.11.18`                                      |

| Daemon      | Requires  | Listens          | Health check            |
| ----------- | --------- | ---------------- | ----------------------- |
| `mariadb`   | —         | 127.0.0.1:3306   | `healthcheck.sh`        |
| `api`       | `mariadb` | 8999             | port 8999 (`API`)       |
| `webui`     | `api`     | 8080             | port 8080 (`Web Interface`) |
| `nodes-map` | —         | 127.0.0.1:3110   | port 3110 (`Nodes Map`) |

The frontend's nginx proxies `/api` to the backend and, through `NODES_MAP_UPSTREAM`,
`/nodes-map/` to the `nodes-map` daemon, which the dashboard's world-map card embeds
(`/nodes-map/embed`). `LN_DIRECTORY_API=off` drops the route for the Lightning directory's edit
API, which belongs to mempool.kilombino.com. The accelerator buttons are off (`ACCELERATOR*`).

The `nodes-map` daemon (`node service.js`) downloads the DB-IP City Lite database to its volume on
first start and monthly after that, then every hour asks the node for `getnodeaddresses 0` and
`getpeerinfo` over JSON-RPC (cookie auth), does a P2P `version` handshake with each clearnet
address that announces the `NODE_BLAKE2B` service bit, and writes `public.json`. Onion addresses
are not probed (`TOR_PROXY=none`).

## Volumes

| Volume     | Mounted at                                   | Holds                          |
| ---------- | -------------------------------------------- | ------------------------------ |
| `config`   | `/backend/mempool-config.json` (file, ro)    | backend config, DB password    |
| `cache`    | `/backend/cache`                             | backend mempool/RBF cache      |
| `db`       | `/var/lib/mysql`                             | MariaDB                        |
| `nodesmap` | `/data` (nodes-map)                          | `dbip.mmdb`, `registry.json`, `public.json` |

The node's `main` volume is mounted read-only at `/mnt/bitcoind` in `api` and `nodes-map` for the
RPC cookie; with Lightning on, Lightning Fork's `main` volume at `/mnt/lnd` in `api`.

## Configuration

`startos/fileModels/mempool-config.json.ts` models the backend's config. Enforced for this chain:
`MEMPOOL.BLOCK_WEIGHT_UNITS` 800000, `POOLS_JSON_URL`/`POOLS_JSON_TREE_URL` pointing at
`Kilombino/mempool-bip110` `main` with `AUTOMATIC_POOLS_UPDATE` on and an hourly
`POOLS_UPDATE_DELAY` (new BLAKE2b miners get tagged), `CORE_RPC.COOKIE_PATH`
`/mnt/bitcoind/.cookie`. `init/watchHosts.ts` writes the bridge addresses of the node
(`CORE_RPC`), Electrs Pruned (`ELECTRUM`, and `MEMPOOL.BACKEND: electrum`) and, with Lightning on,
Lightning Fork (`LND.REST_API_URL`).

## Dependencies

| Package          | Kind     | Range               | Health checks                       |
| ---------------- | -------- | ------------------- | ----------------------------------- |
| `knots-blake2b`  | required | `>=29.4.3:0`        | `node`, `chain`                     |
| `electrs-pruned` | required | `>=0.11.1:48`       | `electrs`, `sync`                   |
| `lightning-fork` | optional, on with Enable Lightning | `>=0.21.3-beta.16:0` | `lnd`, `sync-progress`, `chain-identity` |

A critical task on `knots-blake2b` asks its Auto-Configure action for `prune: 0` and
`txindex: true`: this fork resolves confirmed transactions with `getrawtransaction` and no block
hash, which needs txindex (Mempool Pruned is the variant that does not).

## Actions

- **Enable Lightning** (`enable-lightning`) — toggles `LIGHTNING.ENABLED` with the LND backend
  against Lightning Fork's read-only macaroon.
- **Indexing and Performance** (`indexing-and-performance`) — poll/projection profile,
  statistics, log level, block summaries / goggles / audit / CPFP indexing.
- **Clear Backend Cache** (`clear-backend-cache`) — only while stopped.

## Backups

Only `config`. The database, the cache and the nodes map are rebuilt from the node.

## Limitations

- Needs an unpruned node with txindex.
- Onion nodes on the map only when connected to the node.
- Pools list (GitHub) and prices (exchanges) need internet; the rest does not.

## License

AGPL-3.0, see `LICENSE` (The Mempool Open Source Project®). Mempool and its logos are trademarks
of Mempool Holdings; this package is not affiliated with them.
