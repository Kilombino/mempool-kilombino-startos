import { sdk } from '../sdk'
import { seedFiles } from './seedFiles'
import { watchHosts } from './watchHosts'
import { dependencies } from '../dependencies'
import { setInterfaces } from '../interfaces'
import { versionGraph } from '../versions'
import { actions } from '../actions'
import { restoreInit } from '../backups'

export const init = sdk.setupInit(
  restoreInit,
  versionGraph,
  seedFiles,
  setInterfaces,
  actions,
  dependencies,
  watchHosts,
)

export const uninit = sdk.setupUninit(versionGraph)
