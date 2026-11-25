# tools/ci production trigger suppression — terminal live proof v3

This candidate is intentionally restricted to paths ignored by both production push workflows:

- `tools/ci/**`
- `brain/learning/**`
- `docs/**`

The `tools/ci/install-chromium.sh` delta is comment-only. After protected merge, the resulting main SHA must have no workflow run named `Production Source Snapshot` and no workflow run named `Production Release Readback`.
