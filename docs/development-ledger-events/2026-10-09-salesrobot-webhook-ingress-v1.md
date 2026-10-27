# 2026-10-09 — SalesRobot inbound webhook ingress

Obligation-ID: commercial-salesrobot-webhook-ingress-20261009-v1
Parent-P0: #4198
Delivery-Lane: backend
Candidate-Type: recovery

## Verified implementation
- Existing CRM authority: Supabase `bg_connecties`, existing `powerhouse_runtime_events`, existing Powerhouse sales state.
- Dedicated HTTP ingress boundary, **not** another sender, CRM, scheduler or campaign.
- Vault-backed callback token; JWT verification disabled only because incoming vendor callbacks cannot provide Supabase JWT and the function implements custom authentication.
- Restricted to `contact_replies` and existing campaign `ae2812ad-c3eb-4c90-a0d4-6d4e5a94b93e`.
- Deduplication via provider event/message identifier or payload hash; unambiguous identity matching only.
- No send, approval, reply, revenue or Notion-success claims from synthetic data.

## Production evidence
Supabase Edge Function `powerhouse-salesrobot-ingest` v1 ACTIVE. PostgreSQL pg_net test requests 1488 (401), 1489 (200), 1490 (200 no persistence). The test does **not** prove real vendor data.

## Remaining proof
Save callback in SalesRobot UI for `When a contact replies` and `Bedrijfsgeheugen`. Trigger one genuine customer reply; confirm exact webhook payload, canonical event readback and follow-up outcome/Notion reconciliation. Parent P0 remains open for unproven recipient outreach, outcomes and learning.

## Prevention
Never guess callback URL, never reuse the LinkedIn organization-signature webhook, never claim delivery from a callback probe, never expose Vault token in GitHub.
