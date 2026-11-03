# Mempool Kilombino (StartOS) — build, test, publish

Package `mempool-kilombino`, StartOS 0.4, start-sdk 3.1.0. The explorer is the `mempool/`
submodule (Kilombino/mempool-bip110, branch `main`).

## Images

The three app images are shared with the Umbrel app and built by
`/mnt/datos2/thub-pkg/mempool-kilombino-umbrel/build-images.sh` (Kilombino/mempool-kilombino-umbrel):

```sh
SRC=$PWD/mempool ./build-images.sh v3.2.1-k1 load-amd64   # local, for tests and the x86 .s9pk
SRC=$PWD/mempool ./build-images.sh v3.2.1-k1 load-arm64   # needs: docker run --privileged --rm tonistiigi/binfmt:qemu-v9.2.2 --install arm64
SRC=$PWD/mempool ./build-images.sh v3.2.1-k1 push         # multi-arch to ghcr (publishing)
```

Run long builds as `systemd-run --user --unit=<name> --collect bash -c '...'`
(`XDG_RUNTIME_DIR=/run/user/1000`); the script pauses the `limited2` builder above 82 °C.

## Build the .s9pk

```sh
npm ci
# x86: amd64 images loaded under the manifest tags
make x86
# arm: load the arm64 images under the SAME tags, then
docker images -a --digests | grep mempool-kilombino   # remove by ID any <none> image of these repos
make arm                                              # ("cannot overwrite digest" otherwise)
start-cli s9pk inspect mempool-kilombino_x86_64.s9pk manifest | jq '.id,.version,.images'
```

## Test

- `npx tsc --noEmit`, `start-cli s9pk inspect`.
- Images against the real node: see the docker runs in the Umbrel repo's NOTES.md (same images).
- StartOS VM: `/mnt/datos2/startos-vm/run-vm.sh` (UI https://127.0.0.1:28443). A full install needs
  Knots (BLAKE2b) Companion synced unpruned with txindex and Electrs Pruned in the VM, which the
  test VM does not have.

## Publish (not done yet)

1. Push Kilombino/mempool-bip110 (the submodule commit), create the GitHub repo
   Kilombino/mempool-kilombino-startos and push.
2. `build-images.sh <tag> push`; pin `dockerTag` in `startos/manifest/index.ts` to
   `ghcr.io/kilombino/mempool-kilombino-*:<tag>@sha256:<index digest>` (and make the ghcr
   packages public).
3. `make` (both arches), GitHub release with the two .s9pk, then
   `start-cli registry package add --url <release asset url>` on registry.kilombino.com.
