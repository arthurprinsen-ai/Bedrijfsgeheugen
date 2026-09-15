# 2026-09-15 — Powerhouse Canonical Scan Loop v1

Fingerprint: `powerhouse-canonical-scan-loop-v1`

## Change

Consolidate legacy and current Frisse Blik scans around the existing `scan_inzendingen` authority. Add idempotent server-side website ingestion, Powerhouse runtime/growth evidence, identity-safe claiming from the authenticated portal, and one scan-history projection for old and new records.

## Production actions already performed

- Additive Supabase migration applied to production project `adhjwmvyoixzjtmiroln`.
- `powerhouse-scan-ingest` Edge Function deployed ACTIVE v2.
- Existing 4 historical scan rows preserved.
- GitHub implementation isolated in PR #1622 pending required checks/merge at time of this record.

## Invariants

- No Make dependency.
- No parallel scan table.
- Public browser cannot assert verified tenant/company identity.
- Unverified evidence is aggregate-only.
- Account-level learning starts only after portal identity verification.
- Original anonymous event remains provenance after claim.
- Production completion requires merge, Netlify deploy, public URL readback and canonical Powerhouse evidence/writeback.
