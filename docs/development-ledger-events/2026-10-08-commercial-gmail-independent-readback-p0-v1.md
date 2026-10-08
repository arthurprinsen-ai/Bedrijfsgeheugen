# Development ledger — commercial independent Gmail readback P0

- Obligation: `commercial-gmail-independent-readback-p0-v1` under existing GitHub issue [#4198](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198)
- Root cause: direct Gmail send response was promoted to verified delivery without independent SENT/recipient readback; ambiguous writes risked automatic duplicates.
- Change: same Supabase executor, exact message ID and recipient provider readback, waiting/quarantine for ambiguity, same-lineage reconciliation and idempotent outcome-before-done.
- Regressions: `tests/brain-commercial-independent-readback-p0-v1.test.mjs`.
- Safety: no new scheduler, no double sender, no inferred recipient consent, no fabricated provider ID/impact.
- Observed baseline: two verified public posts, zero provider-proven recipient emails, daily run degraded.
- Delivery state: **CANDIDATE**, not live. Protected checks, Supabase Edge promotion and independent production readback pending.
- Further obligation: after genuine authorized recipient delivery, link replies/engagement/meetings/revenue observations to exact provider message ID; prove learning and calibration before full-green claim.
- Prevent recurrence: `provider-send-success != externally-readback-SENT`; unknown outcome is claimed and non-retryable until reconciled.
