# tools/ci production-trigger suppression live proof

## Purpose

This is the protected-main runtime proof for #3969. The probe changes control-plane content under `tools/ci/**` plus the repository-mandated closure evidence under `brain/learning/**` and `docs/**`.

All of those paths are explicitly ignored by both `Production Source Snapshot` and `Production Release Readback` on `push` to `main`.

## Expected result

After protected auto-merge of #3976, GitHub Actions must show no run of either production workflow for the resulting merge SHA. Any such run is a regression.
