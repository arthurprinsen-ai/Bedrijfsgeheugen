# P0 #4215 — clearing a customer field must invalidate the old business fact

Parent authority: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215

Obligation-ID: portal|all-native-forms|cleared-numeric-unknown-not-zero|20261111-v1
Delivery-Lane: portal
Candidate-Type: recovery
Base-SHA: 4c7cd7760216d04ef0937f02498f7de091f8dd41
Change-Scope: portal-v2/form-primitives.js, portal-v2/portal-impact-engine.js, portal-v2/tests/form-primitives.test.mjs, portal-v2/tests/portal-impact-engine.test.mjs, tests/brain-portal-cleared-numeric-input-20261111.test.mjs, portal-v2/index.html, platform/system-map/canonical-system-map.mjs, docs/changes/2026-11-11-portal-cleared-fields-source-truth.md, docs/development-ledger-events/2026-11-11-portal-cleared-field-source-truth.md, brain/learning/2026-11-11-portal-cleared-numeric-input-v1.json
Writer-Lease-Owner: original Portal V2 / original P0 #4215
Writer-Lease-NonOwner-Action: HOLD on overlapping paths

## Original reproducible defect
The canonical shared native form normalizer converted a cleared numeric string to measured zero through Number('')=0. An invalid required field returned early from bindFields and kept the previously saved value in the client state. The causal impact parser also interpreted null/empty as zero, so an explicit zero cleared to unknown could be considered no change. Together these defects could leave stale input and incorrect downstream advice/financial deltas even though the UI appeared edited.

## Scoped correction in existing authority
1. Shared number, currency, percentage and range controls now normalize missing/invalid to null, preserving genuine explicit numeric zero and valid range bounds.
2. Clearing a required field emits its empty normalized value into the original portal domain state even while the native validity error remains visible; malformed non-empty edits remain rejected. This prevents a hidden, previously entered customer fact from surviving the customer's clear action.
3. The existing causal impact engine treats null/empty as unknown when comparing before/after values and calculating deltas, so zero-to-unknown is a changed input and not a fabricated numeric effect.
4. No new database, outbox, scheduler, provider, autonomous agent or change to tenant authorization.

## Generated portal map synchronization
The original required preflight regenerated explanationInventory hash 0aa61fd9cf4899ca5888a70283d132a7e6aabb356f9fbbdf535e8cc8bd046cb0 after the source change. The existing platform/system-map/canonical-system-map.mjs and portal-v2/index.html version token now match that exact generated output. No bypass or new generator.

## Automated regression
- portal-v2/tests/form-primitives.test.mjs: missing/invalid/explicit-zero for all numeric types, required-field clearing vs malformed input.
- portal-v2/tests/portal-impact-engine.test.mjs: a zero-to-unknown mutation is a real causal change with affected businesscase and advice pages, and no invented numeric delta.

## Truth boundary
This is a source-level fix, NOT proof that all Portal V2 routes and dynamically generated fields have authenticated durable write/readback, that all downstream agent/Heartbeat consumers acknowledge, or that customer advice has been refreshed. Original issue #4215 and design issue #4547 remain open. Only protected Required/BRAIN/CodeQL, merged exact source, Netlify source-exact deployment, two independently authenticated tenant write/reopen/readbacks and Brain/Heartbeat consumer receipts may promote the relevant capabilities to LIVE_PROVEN. Do not record a hypothetical measured zero or inference as provider evidence.
