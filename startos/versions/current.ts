import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

const notes = {
  en_US:
    'First release: the explorer of mempool.kilombino.com for the Bitcoin BLAKE2b chain, with the Bitcoin Nodes World Map, on your own Knots (BLAKE2b) node and Electrs Pruned.',
  es_ES:
    'Primera versión: el explorador de mempool.kilombino.com para la cadena Bitcoin BLAKE2b, con el mapa mundial de nodos, sobre tu propio nodo Knots (BLAKE2b) y Electrs Pruned.',
  de_DE:
    'Erste Version: der Explorer von mempool.kilombino.com für die Bitcoin-BLAKE2b-Chain, mit der Weltkarte der Nodes, auf Ihrem eigenen Knots-(BLAKE2b)-Node und Electrs Pruned.',
  pl_PL:
    'Pierwsze wydanie: eksplorator z mempool.kilombino.com dla łańcucha Bitcoin BLAKE2b, z mapą świata węzłów, na Twoim własnym węźle Knots (BLAKE2b) i Electrs Pruned.',
  fr_FR:
    "Première version : l'explorateur de mempool.kilombino.com pour la chaîne Bitcoin BLAKE2b, avec la carte du monde des nœuds, sur votre propre nœud Knots (BLAKE2b) et Electrs Pruned.",
}

export const current = VersionInfo.of({
  version: '3.2.1:0',
  releaseNotes: notes,
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
