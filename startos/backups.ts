import { sdk } from './sdk'

// Settings only. The database, the backend cache and the nodes map are rebuilt
// from the node after a restore.
export const { createBackup, restoreInit } = sdk.setupBackups(async () =>
  sdk.Backups.ofVolumes('config'),
)
