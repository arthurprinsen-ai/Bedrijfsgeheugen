# BRAIN orchestrator: bounded pending-channel and provider-timeout oracle

Date: 2026-10-22  
Obligation: `ci-brain-orchestrator-pending-oracle-20261022-v1`  
Fingerprint: `ci|brain|orchestrator-pending-selection-bounded-oracle-drift|20261022-v1`  
Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/3742

Independent Unified BRAIN run https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39791707071 on `8e665a86d2bb54712a34fd88bec0e1213df21dd2` reported 3,526 tests / 3,171 passed / 355 failed. Two fail assertions in `tests/brain-powerhouse-content-orchestrator-pending-selection.test.mjs` demanded old source literals `.limit(1)` and `AbortSignal.timeout(45000)`.

The actual `supabase/functions/powerhouse-content-orchestrator/index.ts` queries up to 12 publish/decided entries in priority/channel order and invokes `selectNextContentChannel(pendingRows, Date.now())` for cooldown-aware selection. OpenAI primary timeout is 90_000ms; governed Composio fallback is 45_000ms. The existing error status, sanitation, ambiguous claim, republish-prevention and scheduler controls are unchanged.

Patch only two obsolete assertions and add positive checks for bounded capacity, cooldown selection/reason and both actual provider deadlines. Keep the remaining original tests. Source-verified candidate checks matched all five invariants before write. PR #2455 remains an earlier RELEASED root-cause fix; this is a distinct later test-oracle drift, not replacement runtime work.

Release contract: exact-head Required CI + CodeQL + executed historical/shadow/canary; integrate without overwriting other owned files, then independent complete Unified BRAIN 0 failures. Protected Supabase clean-room parity under #3742, authenticated customer acceptance under #4215 and runtime/provider readback remain independent. No fictional zero-fail, merge or production claim; no scheduler, SQL, runtime, provider, auth or tenant change.
