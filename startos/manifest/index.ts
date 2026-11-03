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
        dockerTag:
          'ghcr.io/kilombino/mempool-kilombino-frontend:v3.2.1-k1@sha256:d65fa398850a6ba96977fe524099b93b5990db9129e6e7c9def643901c1ab097',
      },
      arch: ['x86_64', 'aarch64'],
    },
    backend: {
      source: {
        dockerTag:
          'ghcr.io/kilombino/mempool-kilombino-backend:v3.2.1-k1@sha256:30c6209d560f0951ea07a0c88bd4306928a49fa605f9403d00440e118fb5f799',
      },
      arch: ['x86_64', 'aarch64'],
    },
    'nodes-map': {
      source: {
        dockerTag:
          'ghcr.io/kilombino/mempool-kilombino-nodes-map:v3.2.1-k1@sha256:8bdf4146a48e87414c2335681c3220fcd8dfe4f99cedf2ebb55739f20e325339',
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
