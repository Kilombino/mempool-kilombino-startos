import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

const notes = {
  en_US:
    'Up to date with mempool.kilombino.com (images v3.2.1-k2): the mining pools list with the latest BLAKE2b miners, the YSH (Your Security Hashrate) texts, and the header names updated. The New PoW Scarcity figure needs a daily UTXO-set measurement that this package does not run yet, so it stays hidden here.',
  es_ES:
    'Al día con mempool.kilombino.com (imágenes v3.2.1-k2): la lista de pools con los últimos mineros BLAKE2b, los textos del YSH (Your Security Hashrate) y los nombres del cabecero actualizados. La cifra de New PoW Scarcity necesita una medición diaria del conjunto de UTXO que este paquete aún no hace, así que aquí no se muestra.',
  de_DE:
    'Auf dem Stand von mempool.kilombino.com (Images v3.2.1-k2): die Liste der Mining-Pools mit den neuesten BLAKE2b-Minern, die YSH-Texte (Your Security Hashrate) und die Namen in der Kopfzeile aktualisiert. Die Zahl „New PoW Scarcity“ braucht eine tägliche Messung des UTXO-Sets, die dieses Paket noch nicht durchführt; sie bleibt hier ausgeblendet.',
  pl_PL:
    'Zgodne z mempool.kilombino.com (obrazy v3.2.1-k2): lista pul z najnowszymi górnikami BLAKE2b, teksty YSH (Your Security Hashrate) i nazwy w nagłówku zaktualizowane. Wartość New PoW Scarcity wymaga codziennego pomiaru zbioru UTXO, którego ten pakiet jeszcze nie wykonuje, więc tutaj jest ukryta.',
  fr_FR:
    "À jour avec mempool.kilombino.com (images v3.2.1-k2) : la liste des pools avec les derniers mineurs BLAKE2b, les textes du YSH (Your Security Hashrate) et les noms de l'en-tête mis à jour. Le chiffre New PoW Scarcity demande une mesure quotidienne de l'ensemble des UTXO que ce paquet ne fait pas encore ; il reste masqué ici.",
}

export const current = VersionInfo.of({
  version: '3.2.1:1',
  releaseNotes: notes,
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
