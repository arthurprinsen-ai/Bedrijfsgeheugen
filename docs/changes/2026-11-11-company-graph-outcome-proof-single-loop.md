# 2026-11-11 — Company Graph: no causal links or realised value without source proof

Original issues: #4215 (customer portal) / #4198 (commercial and learning). Fingerprint: `company-graph|unrelated-first-item-causal-link-and-false-realized-value|20261111-v1`.

## Real observed gap
In the original `portal-v2/operating-system/company-intelligence-context.js` the renderer chose the first problem, opportunity, action, outcome and outcome pair separately, linked each one visually in order and displayed untyped `outcome.value` and `pair.realized.value` as realised EUR. Customer-provided snapshots without independent outcome evidence could appear as verified value or connected learning; `Number(bad) || 0` also caused false zero. This contradicted the original `outcome-feedback.js` proof gate and original tenant causal graph promise.

## Scoped correction, same original source/tenant/runtime
- Imports original `verifiedCustomerOutcome` from `outcome-feedback.js` rather than implementing a competing outcome authority.
- Graph arrows are projected ONLY for exact `problem_id` / `opportunity_id` / `action_id` and independent verified outcome-to-action match, never by array order.
- Results require original healthy evidence, typed amount/unit, action ID, metric, baseline, period and verified terminal state. Unverified financial values and misleading fallback €0 do not show.
- Learning requires an independently proven outcome plus original verified learning reference and next decision; a coincidentally first `outcome_pairs` record is never learning evidence. "Doet" and "Leert" remain unproven when execution/learning source proof is missing.
- Expected value requires existing typed `expected_impact` and trusted source; it remains an estimate, not attributed sales/revenue.
- Renders the original Context/Company Graph on existing Portal V2 pages only. No new graph store, worker, scheduler, writes, consent change or imagined customer data.

## Regression and admission
Protected shadow/canary test `tests/brain-company-intelligence-contextual-portal-shadow-canary-v1.test.mjs` now covers authenticated tenant isolation, explicitly linked action/outcome, unmatched separate records, untyped fictional revenue, false `DONE` status, stale evidence and real positive next-decision proof.
Canonical compiler evaluation runs historical_replay, shadow and canary through that existing test, followed by original Required/Portal/BRAIN, CodeQL, System Map integrity, exact main Netlify READY and production browser readback.

## Still EVIDENCE_DUE
No proof of generic third-party software ingestion/source-to-tenant storage, signed provider authorization/writeback, real two-tenant full business trace, executed CRO experiment or Heartbeat learning applied. Four releases are not fully green based on a truthful projection. Existing original #4215/#4198 remain open and original executors continue.
