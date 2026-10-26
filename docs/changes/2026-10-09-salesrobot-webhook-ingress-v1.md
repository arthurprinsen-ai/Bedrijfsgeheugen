# 2026-10-09 — SalesRobot canonical inbound reply ingress

**Obligation:** `commercial-salesrobot-webhook-ingress-20261009-v1`. Parent P0: #4198. Delivery lane: backend. No duplicate CRM, writer, campaign or sender.

## Incident and prevention

The existing `Bedrijfsgeheugen` SalesRobot campaign had no source-controlled, isolated provider reply callback mapped to canonical POWERHOUSE runtime events. A second parallel receiver was proposed in #4237; that PR has been closed unmerged to preserve a single canonical tracked receiver in #4238.

The existing Supabase `powerhouse-salesrobot-ingest` Edge Function uses an explicit campaign UUID, an event selector `contact_replies`, an authenticated Vault token, size limits, provider-ID/payload deduplication, canonical `bg_connecties` matching and `powerhouse_runtime_events` only. It cannot send outbound, register unverified commercial success or manufacture CRM identity.

## Verified evidence

- Active Supabase function v1; independent pg_net probes 1488 returned HTTP 401 without token, 1489 returned HTTP 200 authenticated health, 1490 returned HTTP 200 nonpersisting canary.
- Regression contract: `tests/brain-salesrobot-webhook-ingress-v1.test.mjs`. All three evaluation modes point to this reproducible test.
- Source, Brain learning, append-only engineering event and this human change record travel through the same protected PR.
- Duplicate PR #4237 closed rather than releasing a second ingress.

## Not yet proven

No real SalesRobot `When a contact replies` provider webhook has been received or independently attributed. No recipient message, conversion, Notion synchronization or revenue was asserted. Review provider-callback registration and real event receipts before reporting business-level success.

## Guardrails

Do not infer provider signature from authentication token, do not expose Vault secrets, do not loosen spam/permission constraints and do not bypass protected CI. The production sender remains separate from the inbound webhook.
