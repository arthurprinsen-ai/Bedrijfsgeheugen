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

## Delivery-lineage reconciliation

The predecessor PR #4200 was retired unmerged after the protected preflight identified unrelated AI-runtime files in a stale-base comparison. The six-file P0 delta was projected onto exact clean main `f31726c5cc0085ef533f2a3c02d7a9443a4b90b9` as successor PR #4201. Only protected checks on #4201's own immutable HEAD and exact provider deployment readback may prove delivery. This ledger checkpoint does not constitute release evidence.
