# P0 #4215 — evidence-safe monetary values in the existing Brain cockpit

Obligation: `portal|runtime-financial-truth|unknown-not-zero|20261020`. This is a focused source-truth repair inside existing Portal V2; no new database, prediction engine, event bus, forecast generator or tenancy authority.

## Observed defect
`portal-v2/runtime-evidence.js` used `Number(source.expectedValue)||0` for all economic values and `Number(item.value||item.amount)||0` for activities and outcome evidence. This silently mapped absent or invalid monetary data to €0. `portal-v2/company-cockpit.js` used a €0 fallback for absent backend economics; `company-decisions.js` returned €0 leakage when either side was missing. Rendering therefore claimed a measured zero although no provider proof was available.

## Implementation
- Shared `measuredNumber` source parser projects only finite numeric values, preserves real zero (including string `'0'`) and leaves null/undefined/empty/non-numeric as null.
- The existing executive cockpit now defaults missing monetary fields to null while retaining legitimate source-reported values and EUR.
- Value leakage remains null without *both* measured expected and realized values; keep the positive gap only when both exist.
- Existing HTML currency formatting already renders null as the clear em dash, not €0. Existing Brain decision/action provenance is unchanged.
- The production tenant-finance forecast table remained empty during diagnosis, so no simulated data or forced green status was added.

## Test/acceptance
`node --test portal-v2/tests/company-decisions.test.mjs portal-v2/tests/company-cockpit-ui.test.mjs` (then exact-head Required CI and CodeQL). Browser readback must verify immutable published commit, unknown state on an otherwise authenticated empty economics projection, and a separately verified legitimate zero. This PR does not claim every real dashboard or customer integration is complete. Parent #4215 stays open until end-to-end tenant-impact and verified outcomes.
