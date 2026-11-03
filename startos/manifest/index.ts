import { setupManifest } from '@start9labs/start-sdk'
import { long, short } from './i18n'

export const manifest = setupManifest({
  id: 'mempool-kilombino',
  title: 'Mempool Kilombino',
  license: 'AGPL',
  packageRepo: 'https://github.com/Kilombino/mempool-kilombino-startos',
  upstreamRepo: 'https://github.com/Kilombino/mempool-bip110',
  marketingUrl: 'https://mempool.kilombino.com',
  donationUrl: null,
  description: { short, long },
  volumes: ['cache', 'db', 'config', 'nodesmap'],
  images: {
    frontend: {
      source: {
        dockerTag: 'ghcr.io/kilombino/mempool-kilombino-frontend:v3.2.1-k1',
      },
      arch: ['x86_64', 'aarch64'],
    },
    backend: {
      source: {
        dockerTag: 'ghcr.io/kilombino/mempool-kilombino-backend:v3.2.1-k1',
      },
      arch: ['x86_64', 'aarch64'],
    },
    'nodes-map': {
      source: {
        dockerTag: 'ghcr.io/kilombino/mempool-kilombino-nodes-map:v3.2.1-k1',
      },
      arch: ['x86_64', 'aarch64'],
    },
    mariadb: {
      source: {
        dockerTag: 'mariadb:10.11.18',
      },
      arch: ['x86_64', 'aarch64'],
    },
  },
})
