# P0 #4215 — unify customer input declarations with ONE BRAIN causal routing

## Failure observed
The 2026-10-09 production schema-renderer coverage matrix lists portal field declarations but does not prove end-to-end persistence or exhaustive dynamic/legacy/provider UI controls. In repository review, the existing `portal-v2/portal-impact-engine.js` lacked canonical source-page mappings for `portal.business_context.*`, `portal.strategicModels.*`, `portal.aiCapabilitySources.*` and `portal.aiAct.*`, even when the separate declaration classifier considered some paths mapped. Twenty real strategic model note fields were hidden behind an empty supplemental `paths: []`.

## Minimal repair, existing authority
- Reuse `STRATEGIC_MODEL_IDS` from `portal-v2/strategic-models-core.js` to declare all twenty existing strategic note paths without creating a second registry.
- Amend `sourcePageForPath` and `PATH_EFFECT_RULES` in the existing `portal-v2/portal-impact-engine.js` for missing context/strategic/AI and financial categories.
- Mark cross-domain review and invalidation of businesscase, working capital, due diligence, AI governance, sovereignty, ESG/CSRD, risk and roadmap for specifically relevant changes, with no fabricated regulatory conclusions or financial savings.
- Harden the pre-existing source/renderer matrix: `CANONICAL_CAUSAL_SOURCE_UNMAPPED` and `SUPPLEMENTAL_CAUSAL_SOURCE_UNMAPPED` cause Required preflight failure rather than false MAPPED.
- Add repeatable, source-level regression to `tests/brain-p0-4215-input-surface-coverage-v1.test.mjs`.

## Code-level validation contract
`node tools/ci/p0-4215-portal-input-coverage-matrix.mjs`

`node --test tests/brain-p0-4215-input-surface-coverage-v1.test.mjs portal-v2/tests/one-brain-impact-contract.test.mjs portal-v2/tests/portal-causal-propagation.test.mjs`

## Scope and non-claim
No new Brain, schema, scheduler, Heartbeat executor, customer session or parallel data store. Every affected page is an invalidation/reassessment target; not every change results in a verified new card or quantified financial effect. PR CI status and merged exact-main production readback must be independently confirmed. P0 #4215 remains open until complete authenticated DOM inventory, two authorized isolated customer sessions, real server write/ONE BRAIN consumer ACK and persistent reloaded output, >750 KB outbox durability, 200 fields/1000 observations, and customer-specific legal CSRD/ESRS review.
