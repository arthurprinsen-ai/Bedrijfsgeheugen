# Netlify tools/ci early-trigger suppression

## Proven waste

Protected main merge `e902e07fef8b3411451280072b40f0d0aac24bb8` changed Netlify control-plane files including `tools/ci/**`. The canonical applicability classifier correctly treated those paths as governance-only, but GitHub still allocated both Netlify production workflows before that classifier ran:

- Production Source Snapshot: run `37478237193`
- Production Release Readback: run `37478237085`

Both completed without needing a Netlify production mutation. The defect was therefore early workflow admission, not deployment correctness.

## Structural fix

Both production workflows now include `tools/ci/**` in `push.paths-ignore`. The in-job authority remains `tools/delivery/netlify-deployment-applicability.mjs`; the static trigger is only an early fan-out optimization.

Mixed commits remain safe: when a runtime, website, portal, or Netlify-hosted path is present, GitHub path filtering still starts the workflow and the canonical classifier fails closed as before.
