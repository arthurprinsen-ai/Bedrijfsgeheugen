# P0 commercial Gmail readback, without duplicate sends

Issue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## Existing production truth (2026-10-08 15:33 UTC)

- Predictive fallback is proven live on approved Composio/Groq.
- Two public publications meet the public commercial publishing SLA.
- The daily commercial run remains `degraded`; provider-proven recipient email count is **zero**.
- `selected=0, sent=0` proves only zero eligible prepared emails, not a delivered direct outreach.
- No lawful recipient can be invented, and no individual send should be forced.

## Root cause addressed in this scoped change

The existing `powerhouse-autonomous-outreach` considered a successful `GMAIL_SEND_EMAIL` call provider verified even without independent Gmail readback. A timeout or failure after sending could be marked retryable error and produce a duplicate side effect.

## Narrow implementation

The existing executor now reads back the exact Gmail message ID via `GMAIL_FETCH_MESSAGE_BY_MESSAGE_ID`, requires Gmail `SENT` label and a matching recipient header, and only then writes a deduplicated canonical outcome and sets action status to `done`. A claimed `waiting` action with uncertain external side effect stays quarantined; on subsequent executions the same existing executor tries readback only, never sends it again. No new cron, sender, store or external mail is introduced by this code change. The existing consent, suppression, message quality and recipient preparation gates are retained.

## Known boundaries and non-claims

- This is a **source candidate**, not an applied production repair until protected merge and Edge deployment/readback.
- Provider readback schema/scopes and action/outcome table writes must pass real preview and authorized canary before promoting green.
- If Gmail returns an ambiguous payload or missing `SENT`/recipient evidence, the result remains `unverified`; manual reconciliation might still be required where provider ID is missing.
- Zero eligible prepared emails cannot be solved by creating leads, inferring consent or sending promotional spam.
- Actual replies, meetings, attribution, conversion/revenue and calibrated learning still require external observations bound to the delivery ID.
- The full P0 remains open until issue #4198's complete acceptance contract has genuine production evidence.

## Required regression and promotion

`node --test tests/brain-commercial-independent-readback-p0-v1.test.mjs` plus required checks, CodeQL, applicable Supabase Preview, protected merge, exact Edge version readback, a genuine authorized send and subsequent outcome/learning readback. No unchecked direct push to main.
