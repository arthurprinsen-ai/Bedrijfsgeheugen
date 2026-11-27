# Existing innovation code is not missing work: exact original source-to-effect reconciliation

**Original P0:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## Verified root cause

The original Engineering/CRO continuity watchdog merged as https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5977 read all 14 source-bound original candidates (14/14 native Brain receipts). It truthfully found a protected PR for candidate 2c1ecc77, but recorded original sales read-model candidate `55bb0754-355b-4940-aaea-aed7123e7e57` as `PROTECTED_BUILD_DUE` solely because this candidate's implementation occurred before the current bounded Codex code generator. Its original `brain_operations.evidence.protected_implementation_source_evidence` already recorded protected PR #5857, native production evidence and the existing original portal readmodel. Protected follow-ups #5866 and #5879 addressed writer-time truth and repeated execution. The original readmodel `readOriginalSalesExecutionAudit` already joins real internal source action-event histories and intentionally makes **no external delivery, revenue or customer-value claim**.

The native original code selector safely blocks PR-parent re-generation and correctly returned `NO_NEW_SOURCE_BOUND_SAFE_CODE_CANDIDATE` in the 2026-11-17 recovery run. The problem is therefore not to weaken that duplicate guard, but to reconcile pre-existing protected implementations and measure the remaining gap.

## Actual scope of this correction

Within the **same original daily** `scripts/brain/innovation-original-delivery-continuity.mjs`, read only the original implementation identity for the source-bound sales read-model candidate. Verify original candidate ID, Engineering owner, source revision, known official parent PR URL and existing protected release evidence. Independently query GitHub for exact PR #5857 and verify official merged state, PR body candidate identity, owner and main base. Then run the *already existing* admin-only source audit `readOriginalSalesExecutionAudit` with original service-role Supabase PostgREST, exact 7-day Content-Range/full pagination and a 500-event bound. Store only the aggregate result: internal execution events, truly writer-joined events, unsupported rows, missing actions, newly observed event gaps and explicit `independent_provider_send_verified=false` and `independent_revenue_or_customer_value_verified=false`. Evidence is updated only on a material fingerprint change in the original versioned Brain CAS, independently GET-read back; no new table/agent/cron/consumer or external send.

### Fail-closed outcomes

- Original protected source exists but native PR cannot be verified: `PREEXISTING_PROTECTED_SOURCE_NATIVE_PR_READBACK_DUE`
- Native original protected PR verified, current source audit missing/stale/partial: `PREEXISTING_PROTECTED_SOURCE_CURRENT_PROVIDER_AUDIT_DUE`
- Fresh full 7-day internal event source joined: `PREEXISTING_SOURCE_CURRENTLY_MEASURED_CAUSAL_OUTCOME_DUE` — **not actual causal outcome**
- Internal source join gaps: `PREEXISTING_SOURCE_GAPS_REQUIRE_ORIGINAL_OWNER_REPAIR`
- Zero recent source events: `PREEXISTING_SOURCE_NO_CURRENT_EVENTS_MEASUREMENT_DUE`

A verified original source check is NOT a live Netlify deployment get, a provider send, a customer action, a measured monetary benefit, original consumer ACK or terminal success. The original 14 `INNOVATION_DELIVERY` obligations stay OPEN until their appropriate independent implementation, result/holdout, learning and owner handoff gates are satisfied. Safe rollback: revert protected source-only implementation and preserve previous Brain evidence. Regression: `tests/brain-innovation-existing-protected-source-reconcile-20261117.test.mjs`.

## Post-merge historical parent selector coexistence

The original engineering team separately merged https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5981 on 17 November. That patch safely allows a candidate with a historical, truly merged, source-disjoint predecessor (e.g. SQL guard PR #5109) to become a **new** bounded code work order. That is appropriate only if no existing implementation was already delivered for the SAME candidate/source revision. Candidate `55bb0754-355b-4940-aaea-aed7123e7e57` has protected source evidence for PR #5857; calling Codex again would be a duplicate. The existing code selector now checks exact original `protected_implementation_source_evidence` contract, owner, revision, candidate id, PR URL and protected release before the previous-parent gate. It holds the job for native delivery/effect reconciliation; source conflict fails closed. The original candidate's future source effect remains for Heartbeat, not an automatic code rebuild. The protected CI regression also replays the historical-parent selector negative tests.
