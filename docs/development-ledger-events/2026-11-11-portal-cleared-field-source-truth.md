# 2026-11-11 — Portal V2 required field clearing / zero-is-not-unknown

Original owner: Portal V2 P0 #4215
PR: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5596
FingerPrint: portal|all-native-forms|cleared-numeric-unknown-not-zero|20261111-v1
Base-SHA: 4c7cd7760216d04ef0937f02498f7de091f8dd41
Delivery-Lane: portal
Candidate-Type: recovery
Status: CANDIDATE; independent production acceptance NOT PROVEN.

## Original defect and root cause
The shared native form parser converted cleared numeric input to measured zero. Its invalid-required-field handler did not forward an empty value, retaining an old customer fact. The original impact comparator also turned missing into numeric zero, so a real zero-to-null edit could be misclassified as no causal change. This is data integrity, not a cosmetic form problem.

## Repair, prevention, reproducibility
Changed only the existing portal form primitives and causal impact engine, and created regression tests. Empty/invalid numeric values become null; explicit valid zero remains zero; clearing a required field immediately removes the stale client business fact while keeping validation visible. Unknown-to-zero deltas are not numeric gains. The original authenticated save, tenant scope, Brain ACK and existing page invalidation remain the only authority.

Regression files:
- portal-v2/tests/form-primitives.test.mjs
- portal-v2/tests/portal-impact-engine.test.mjs
- tests/brain-portal-cleared-numeric-input-20261111.test.mjs

## CI admission incident on this same PR
Initial protected hygiene / admission job https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/42967394799 failed PR_MACHINE_METADATA_INVALID:DELIVERY_LANE_INVALID because PR metadata used frontend instead of the allowed canonical portal lane. The original PR metadata and existing human change doc were corrected to portal, no workflow policy weakened.
Second run https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/42967795466 failed INTEGRATION_BUNDLE_CLOSURE_INCOMPLETE: activity_ledger,brain_learning. This ledger and one same-lineage Brain learning record provide the original admission-required artifacts, not an exception.

## Acceptance and residual limitations
Code + tests are not live product proof. Must pass exact-head protected Required/BRAIN/CodeQL, then protected main merge and exact Netlify source/deploy readback; two authenticated tenant user-change/reopen tests; Brain/Heartbeat/Powerhouse consumer ACK and changed dependent advice evidence. Original issue #4215 remains open for all field/provider/dynamic surface coverage, concurrency and durable outbox. No manual fake-green update or second executor.
