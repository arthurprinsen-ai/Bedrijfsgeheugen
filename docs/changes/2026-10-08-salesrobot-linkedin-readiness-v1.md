# SalesRobot LinkedIn campaign readiness for POWERHOUSE

The user-created `Bedrijfsgeheugen` campaign is recorded as the canonical target campaign (UUID `ae2812ad-c3eb-4c90-a0d4-6d4e5a94b93e`). The campaign currently has no prospects or sequence, is not startable, and must not be described as sending.

## Structural repair
- Existing `powerhouse-linkedin-sales-machine` continues to own direct LinkedIn sales actions. No new sender, CRM or Heartbeat.
- It may not set SalesRobot `AVAILABLE` based only on an authenticated HEALTHY LinkedIn profile.
- Require provider billing status, positive remaining execution days, at least one campaign and an active configured campaign before claiming send capability. Missing entitlements or setup resolve to `CONFIG_REQUIRED`, not a false success.
- Preserve message quality, evidence-backed personalization, explicit human approval, correct recipient address, deduplication and independent send proof.

## Current operating boundary
- Supabase canonical registry stores provider/campaign identity as CONFIG_REQUIRED. This record alone does not import contacts, create a sequence, authorize messaging or make campaign active.
- Source CRM `bg_connecties` contains 23,295 profiles; CRM export membership is not proof of marketing consent or personal approval.
- No bulk upload or sending without lawful contact eligibility and evidence. Do not use provider-unsafe scraping or automatic LinkedIn actions contrary to platform rules.
- Website trial-days banner indicates 6 days, while provider account API execution balance says 0. Treat as different unresolved measures and request provider clarification if still 0 after sequence setup.
- For completion: finish campaign sequence in SalesRobot; ensure provider can start and has execution capacity; approve a small eligible cohort; run real canary, record send acknowledgement, replies, meetings, proposals, orders and revenue in existing POWERHOUSE outcomes.
- Green requires protected CI merge, active function byte-level readback and observed downstream commercial results. Source-only success is not commercial delivery.
