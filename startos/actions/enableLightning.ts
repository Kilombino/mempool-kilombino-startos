import { configJson } from '../fileModels/mempool-config.json'
import { sdk } from '../sdk'
import { isLowRam, lndCertPath, lndMacaroonPath } from '../utils'
import { i18n } from '../i18n'
const { InputSpec, Value } = sdk

const lowRamWarning = isLowRam()
  ? i18n(
      'Lightning network data is memory-intensive and is recommended only on devices with 16 GB of RAM or more. Running it alongside Bitcoin and an Electrum indexer on a smaller device can trigger out-of-memory crashes that take down Mempool or one of its dependencies.',
    )
  : null

const lightningInputSpec = InputSpec.of({
  lightning: Value.toggle({
    name: i18n('Lightning Fork'),
    description: i18n(
      'Show the Lightning network of the BLAKE2b chain, as seen by Lightning Fork on this server, in the Lightning tab. Off hides the tab.',
    ),
    default: false,
  }),
})

export const enableLightning = sdk.Action.withInput(
  'enable-lightning',

  {
    name: i18n('Enable Lightning'),
    description: i18n(
      'Use this setting to select the Lightning node used to serve network data to the Lightning tab in Mempool',
    ),
    warning: lowRamWarning,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  },

  lightningInputSpec,

  async ({ effects }) => {
    const config = await configJson.read().const(effects)
    if (!config) throw new Error('Config file not found')
    return { lightning: config.LIGHTNING.ENABLED }
  },

  async ({ effects, input }) =>
    configJson.merge(
      effects,
      input.lightning
        ? {
            LIGHTNING: { ENABLED: true, BACKEND: 'lnd' },
            LND: { TLS_CERT_PATH: lndCertPath, MACAROON_PATH: lndMacaroonPath },
          }
        : { LIGHTNING: { ENABLED: false } },
    ),
)
