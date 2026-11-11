# 2026-11-11 — ONE BRAIN portal input causal truth / agent skill sync

Original obligation: portal|v2|production-input-causal-truth-agent-skill-borging|20261111-v1
Owner: original Portal V2 and ONE BRAIN #4215
Base-SHA: 8e291bf3493fdb87d052712e97c5a8126984a3fd
Delivery-Lane: docs
State: POLICY_CANDIDATE before protected merge/readback; no new runtime executors.

## Observed history and actual production results
Earlier independent production browser run 42969509727 after #5596 was 12 PASS / 4 FAIL / 1 SKIP. After #5597 run 42974453301 was 15 PASS / 1 FAIL / 1 SKIP with original demo bulk/restore still raising PORTAL_BRAIN_REPLAY_SOURCE_CONFLICT. #5598 repaired the demo-only pending Brain obligation and exact production browser run 42975963909 became 16 PASS / 1 SKIP / 0 FAIL plus successful visual baseline regression. Exact main SHA and deployed provider: 8e291bf3493fdb87d052712e97c5a8126984a3fd / Netlify 6af411b8d9fee5cd23a504b1 READY.

## Root causes / permanent preventions
1. Number('') coerced cleared customer data into a measured 0; required fields retained stale prior facts. Rule: null is unknown; deliberate numeric 0 is true; invalidation propagates, no imaginary economic delta.
2. Initial anonymous visual identity notification could close valid native routing; concurrent fresh ancestor/descendant section snapshots were inconsistent. Rule: no false anonymous tenant boundary, genuine tenant switch clears old private DOM, current pre-submit overlapping snapshots must share one exact revision, historical replay conflict remains hard-stop.
3. Demo-only local entries incorrectly created live Brain pending obligations. Rule: demo can update local preview/calculations, but no live provider, Brain ACK, Heartbeat or customer outcome; actual authorized customer input must retain durable journal and real ACK.
4. Skills/agents could describe pass/browser green as all-source outcome. Rule: pin each independently proven evidence stage and keep original #4215 OPEN until actual authenticated provider/tenant and consumer readback proves every affected path.

## Change in this bundle
Updated existing AGENTS.md and three original skills, with machine test tests/brain-portal-agent-skill-causal-truth-20261111.test.mjs and canonical learning record. No runtime code patch and no second scheduler/owner/provider. These policy changes are not considered deployed to any remote agent runtime until protected source merge and original skill projection/readback, and do not independently establish end-to-end authenticated customer proof.
