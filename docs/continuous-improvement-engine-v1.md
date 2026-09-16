# Powerhouse Continuous Improvement Engine v1

Canonical fingerprint: `powerhouse-continuous-improvement-engine-v1`.
Parent: `powerhouse-engineering-os-v1`.
Learning authority: `BRAIN-CHAT-LEARNING-v1`.
Delivery authority: `BRAIN-DELIVERY-v2`.
Technology-currency authority: `powerhouse-state-of-the-art-adoption-v1`.

## Operating loop

`OBSERVE -> CLUSTER -> CANDIDATE -> BASELINE -> EVALUATE -> DECIDE -> SHADOW_OR_CANARY -> PROMOTE_OR_REJECT -> PROD_OBSERVE -> ROLLBACK_OR_CONFIRM -> ATTRIBUTE -> WRITEBACK -> REVALIDATE`

The engine turns existing Powerhouse evidence into deterministic improvement candidates without introducing a second brain, memory, queue, learning database, experiment database, analytics truth or architecture registry.

## Candidate identity and overlap

Candidate identity is derived from canonical component/authority, problem/opportunity class, normalized evidence cluster, change class and scope. Exact duplicates coalesce before persistence. Overlap is resolved as `COALESCE`, `COMPARE`, `SUPERSEDE` or `ISOLATE`; overlapping production promotions are not allowed merely because different agents proposed them.

## Promotion gates

Security/tenant isolation and correctness/reliability are non-degradation gates. Unknown critical evidence fails closed. Cost or latency regression requires explicit measurable compensated-benefit evidence. Production promotion requires exact candidate and last-known-good rollback identities. Business-impact claims require business/outcome evidence. No single aggregate score decides promotion.

Incomplete non-critical evidence may enter only a bounded experiment with exposure, observation window and rollback trigger. The existing autonomy budget and SLO/error-budget controls remain authoritative.

## Revalidation and attribution

Age-sensitive decisions carry `revalidate_after` semantics and resolve to `CONFIRMED`, `CANDIDATE_REQUIRED`, `SUPERSEDED` or `BLOCKED_HARD_BOUNDARY`. Attribution compares comparable baseline/current measures and never assumes causality. A causal claim is allowed only when the evidence explicitly establishes causal identification.

## Runtime and persistence

The executable is `scripts/brain/continuous-improvement/index.mjs`. Runtime persistence reuses existing Supabase/Brain records and evidence lineage. Human-readable state is projected into the existing Powerhouse System Map, Human Handbook, Master Register, Latest Verified State and Agent Activity Log after protected release.

## Release rule

The capability becomes `LIVE & BEWEZEN` only after exact-head Required/BRAIN success, protected merge, exact-main readback, direct Supabase CurrentState + Learning readback on the protected merge SHA, and Notion projection/readback. Documentation or CI alone is not production proof.
