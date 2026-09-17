# Powerhouse Canonical Truth Closure — Implementation Plan

Date: 2026-09-16
Design: `docs/superpowers/specs/2026-09-16-powerhouse-canonical-truth-closure-design.md`

## 1. Add deterministic reconciliation kernel

Files:
- create `scripts/brain/powerhouse-canonical-truth-closure.mjs`
- create `tests/brain-powerhouse-canonical-truth-closure.test.mjs`

Implement pure functions for classification, materiality, completion aggregation, assurance freshness, and real production outcome-lineage validation. No external mutation is permitted from the pure kernel.

## 2. Add source-controlled Supabase closure contract

Files:
- create a forward-safe migration under `supabase/migrations/`
- create `tests/supabase-powerhouse-canonical-truth-closure.test.mjs`

Reuse existing `brain_obligations`, `brain_blockers`, `brain_production_truth`, and `brain_reconciliation_jobs`. Add only the minimum helper/read-model needed to project canonical classification and completion without adding a parallel authority. Keep anon/authenticated access fail-closed.

## 3. Reconcile live synthetic/stale state

Production actions:
- resolve only blockers whose current evidence explicitly proves `synthetic=true`;
- fulfil the leaked-password obligation only after current Security Advisor readback proves that finding absent;
- update stale completion-supervisor evidence to the new current classification model;
- leave current external/defect obligations open or blocked.

All mutations must retain prior evidence and append reconciliation evidence.

## 4. Reconcile GitHub issue truth

Close only issues fully contradicted by fresh current authority, including old main-protection claims when current protected-main readback proves the control exists. Mixed issues remain open with a current reconciliation note. Make-only operational replay paths are marked retired/superseded by the canonical Make-free authority rather than re-executed.

## 5. Security classification

- verify effective function/table privileges;
- never add blanket RLS policies;
- classify RLS-without-policy INFO findings according to actual client privilege exposure;
- preserve service-role-only internal tables as deny-by-default;
- record any genuine externally reachable defect as material.

## 6. Whole-Brain and outcome proof

Read existing production evidence for decision execution, RUM samples, legacy calculation parity and commercial outcome-learning lineage. Only close obligations supported by fresh real production evidence. Otherwise keep them material with exact missing evidence.

## 7. Operations assurance

Build an evidence matrix across restore/DR, IAM, secret rotation, SBOM/deprecation, SLO/alert drills and required provider-readback. Missing/stale proof blocks total LIVE & BEWEZEN without being mislabelled as a confirmed defect.

## 8. Protected delivery and readback

- run relevant tests/checks through the existing GitHub path;
- create PR from the current-main successor branch;
- merge only when required checks are terminal green;
- re-read protected `main` and production Supabase state;
- update canonical obligations/learning with exact evidence;
- report one hard final Powerhouse status backed by current readback.