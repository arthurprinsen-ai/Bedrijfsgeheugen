# ONE BRAIN incident ledger — original composer SQL timeouts

Date: 17 Nov 2026; incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
Fingerprint: powerhouse|original-composer|plan-read-503-over-50s|20261117-v1

**Observed:** Four original edge provider responses HTTP 503 PLAN_READ:canceling statement due to statement timeout in original 5-minute consumer. Cron/commercial Heartbeat still shows dispatched=true, pending_candidates=5. Native original RPC EXPLAIN ANALYZE 52.221953 sec, ~5,953,293 shared hits; read-only shadow cheap rank + lateral OFFSET 0 0.016103 sec, 1,521 hits, same five slots. The mismatch between scheduler enqueue and HTTP 503 is measurable and distinct from Tavily-432 subscription limit.

**Change:** Same original production SQL candidate API with identical RPC signature and result rowtype, cheap base action ID eligibility, bounded two-email fairness and lateral correlated full message-plan hydration. No new queue, executor, sender, send consent, budget, OAuth bypass or artificial green. Security service role only. Existing agent skill and ONE BRAIN machine learning updated.

**Acceptance:** Protected Required+CodeQL+Preview, protected merge, original native SQL/privilege readback, original low latency EXPLAIN, subsequent natural original Edge HTTP 200 processed + original action ID and quality/source disposition, independent Gmail provider-ID/readback only for sent, honest DEGRADED if no valid source. Record any failed CI checks as durable prevention. Original P0 stays OPEN until real source/outbound evidence.

**Rollback:** Only via protected PR restoring previous original function, not direct production hotpatch.
