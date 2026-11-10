# 2026-11-10 — oorspronkelijke Gmail provider-onzekerheid en anti-dubbelverzendgrens

- Obligation `powerhouse|commercial|prior-gmail-provider-id-reprepared-duplicate-send-risk|20261110-v1`, parent https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198.
- 10:37 UTC, original #116: first real research-to-composer repaired handoff produced original `prepared`; original Gmail sender recorded external message ID but independent readback `GMAIL_READBACK_MISMATCH` (ID differs, SENT label and exact recipient matched). Truth remains UNVERIFIED.
- 10:38 UTC, source-readback showed same action unexpectedly `PREPARED` with `needs_readback=true` and `republish_forbidden=true` and original provider ID. Do not claim second send.
- 10:40 UTC, exact-action conditional Supabase DML safely restored `WAITING` with original provider ID preserved, immutable quarantine flag `external_resend_forbidden=true`; no provider calls. Follow-up source at 10:42 still WAITING; one-time mitigation is not durable.
- Root cause boundary: upstream re-preparer not yet causally attributed. The original autonomous sender lacked a final send-time no-resend predicate for PREPARED records carrying prior provider side effects.
- Repair within original sender/shared helper only. Explicit idempotency/suppression untouched; no alternate scheduler, Gmail sender, synthetic provider outcome.
- Regression: `tests/brain-original-ambiguous-gmail-no-resend-20261110.test.mjs`; machine learning historical/shadow/canary; skill contract; human change record.
- Release must pass exact-head protected checks and original Edge GitOps readback. Never count HTTP 200/cron OK as Gmail delivery or experiment success.
