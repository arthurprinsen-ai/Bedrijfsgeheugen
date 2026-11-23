# Schema-safe replay for the original #116 relationship-research source

**Date:** 2026-11-15  
**Parent P0:** [GitHub issue #4198](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198)  
**Owning release:** [PR #5854](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5854)  
**Affected original pipeline:** existing #116 public research → original recipient/identity #138 → ONE BRAIN → commercial Heartbeat → original-agent:commercial safe-review.

## Reproduced production failure (not a speculative incident)

Protected PR #5852 deployed the same original #116 dispatcher and public research Edge to real Supabase production. The dispatcher then woke an otherwise starved original held source action and corrected its earlier false `VERIFIED` Google tracking redirect at event `05618504-b072-4c35-ade3-d365bdfd70fe` to `REJECTED_TRACKING_REDIRECT` and `state=error`. The **remaining original research action** `1be12b8f-8d43-42e1-b0da-d8ce20291ee4` nevertheless stayed `done`, because the Edge tried to write SQL `source_url: null` when returning the action to `waiting`. Original table `public.powerhouse_sales_actions` defines `source_url text NOT NULL DEFAULT ''`. The native original Edge returned HTTP **503**, `ORIGINAL_WRAPPED_SOURCE_SAFE_RETRY` with a Postgres not-null violation. The original recipient `e5047182-405c-43f2-8c25-7674f1a2cb70` correctly remains `prepared` and `SOURCE_SPECIFIC_EVIDENCE_REQUIRED`; there was no authorized send.

## Narrow fix on the existing source owner

Update **only the existing** `supabase/functions/powerhouse-relationship-public-research/index.ts` recovery path:
- Write `source_url:''` (empty string) into the original `powerhouse_sales_actions.source_url` **non-nullable column**, rather than SQL `NULL`.
- Retain `public_research_execution.source_url:null` in nested evidence to mean *no independently verified publisher page*; preserve the historically rejected Google redirect under `public_research_execution.rejected_source_url` for audit, not as a valid source.
- Keep original source event `REJECTED_TRACKING_REDIRECT`, original research action ID, original recipient person/company match, original `SOURCE_SPECIFIC_EVIDENCE_REQUIRED`, same 24-hour bounded retry, source and recipient CAS, independent next owner and external-send prohibition. No new scheduler, Edge function, queue, vendor, added API call, automatically approved email or parallel agent.

Update both existing regressions `tests/brain-original-serp-tracked-redirect-safe-retry-20261115.test.mjs` and `tests/brain-original-116-wrapped-source-dispatch-wakeup-20261115.test.mjs` to assert the database-safe empty text value and forbid the former SQL null update. Keep the single source research skill, native incident ledger and ONE BRAIN causal learning `brain/learning/2026-11-15-original-wrapped-source-not-null-safe-replay-v1.json` with `historical_replay`, `shadow` and `canary` regression references.

## Protected deployment and required independent production proof

The first candidate of this PR was rejected by the protected `INTEGRATION_BUNDLE_CLOSURE_INCOMPLETE: human_documentation` gate, **not by the database fix**. This file supplies that independently readable document for the single protected release. Subsequent candidate must pass exact-head canonical admission, Required/backend, CodeQL JS/TS and Python, and the original Supabase Edge production integration. After protected merge independently read native deployed Edge function source/version to confirm the `source_url:''` correction, then run the **same existing #116 dispatcher once only when original no-send/due/identity gates prove safe**. Verify the old source event is quarantined, the exact original research action becomes `waiting` with a real bounded due date and `source_url=''`, the same original still-held recipient receives `SOURCE_REDIRECT_REJECTED_NOT_VERIFIED`, and no provider-linked external message was sent. The next natural run must be idempotent.

Do not mark the **commercial** obligation `43c90754-3fd0-4c97-bb14-fbf815e12f47` or P0 issue #4198 `FULFILLED` merely because internal source repair succeeded. Unverified contact addresses, ten other first-party HTML retries, lawfulness, suppression, authorized outbound, independent reply/meeting/revenue evidence and applied learning remain their own traceable requirements. If production readback fails, record the failure and leave the original executor active.
