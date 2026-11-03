# Mempool Kilombino

## Documentation

- [mempool.kilombino.com](https://mempool.kilombino.com) — the same explorer, public, to compare with yours.
- [Kilombino/mempool-bip110](https://github.com/Kilombino/mempool-bip110) — the explorer's source and README.
- [Start9 Bitcoin Guides](https://docs.start9.com/bitcoin-guides/) — archival versus pruned Bitcoin nodes on StartOS.

## What you get

- A **Web UI**: blocks, transactions, addresses, fees and the mempool of the Bitcoin BLAKE2b chain (BTC), with the mining dashboard and BTC prices of mempool.kilombino.com.
- The **Bitcoin Nodes World Map** on the dashboard and at `/nodes-map/`: every hour your node's known peers on this chain are contacted and placed on a map.
- An optional **Lightning** tab with the Lightning network of this chain, from Lightning Fork.
- Its own database; there is nothing to configure.

It installs alongside the official Mempool and Mempool Pruned.

## Getting set up

1. Install **Bitcoin Knots (BLAKE2b) Companion** and **Electrs Pruned**.
2. Install Mempool Kilombino. A task appears on Knots (BLAKE2b) Companion asking for a **full node with the transaction index on** (pruning off, txindex on). Run it. This explorer looks transactions up in the node itself, so it needs the whole chain and the index: turning pruning off makes the node download the full chain again, which takes a while and needs the disk space for it.
3. Wait for the node and Electrs Pruned to finish syncing, then start Mempool Kilombino.

## Using it

Open the **Web UI**. The first start indexes the mining history of the chain, so the mining pages fill in over the first hour or so. The nodes map shows its first nodes a few minutes after the first start: it downloads a free IP-to-city database (DB-IP) first and then contacts the nodes.

### Actions

- **Enable Lightning** — show the Lightning network from Lightning Fork on this server in the Lightning tab. Lightning Fork must be installed, running and have a wallet.
- **Indexing and Performance** — how often the explorer polls the node, mempool statistics, the log level, and the optional indexes (block summaries, goggles, block audit, CPFP). An index you turn on is backfilled on the next start, which can take hours.
- **Clear Backend Cache** — with the service stopped, deletes the backend's mempool cache; use it if the backend fails to start while loading it.

## Limitations

- The node must be unpruned with txindex on; a pruned node is not supported (use Mempool Pruned for that).
- The nodes map contacts nodes over clearnet only; onion nodes appear only while they are connected to your node.
- The mining pool list is read from GitHub and the BTC price from public exchanges; without internet those parts stay empty, the rest works.
