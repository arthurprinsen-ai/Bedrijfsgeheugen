# tools/ci production workflow trigger suppression — live proof

This candidate is intentionally limited to paths ignored by both production push workflows:

- `tools/ci/**`
- `brain/learning/**`
- `docs/**`

The executable delta in `tools/ci/install-chromium.sh` is comment-only. After protected merge, the resulting `main` SHA must have no workflow run named `Production Source Snapshot` and no workflow run named `Production Release Readback`.

Any such run is a regression.
