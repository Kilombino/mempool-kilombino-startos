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
          'ghcr.io/kilombino/mempool-kilombino-frontend:v3.2.1-k2@sha256:0308a111e99f22aed5c730a81a41175d5dc8ba735dec3c7755a8357921b75ed7',
      },
      arch: ['x86_64', 'aarch64'],
    },
    backend: {
      source: {
        dockerTag:
          'ghcr.io/kilombino/mempool-kilombino-backend:v3.2.1-k2@sha256:0aaf1200f7c70fe40a2814238ef87e4656d9d7bed71192af6493c7656e3de203',
      },
      arch: ['x86_64', 'aarch64'],
    },
    'nodes-map': {
      source: {
        dockerTag:
          'ghcr.io/kilombino/mempool-kilombino-nodes-map:v3.2.1-k2@sha256:481395b2e5bb063003bd72832272c45ce75570665ae7a3250e6da598066502a9',
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
