# Development ledger — 2026-11-11 scan → growth ACK and EN pricing/scan funnel

- Incident: `portal|scan-pricing|growth-event-silent-non-ack-and-en-funnel-gap|20261111-v1`.
- Original owners: website SEO/CRO growth-event producer + existing Supabase `powerhouse-scan-ingest`, linked to original #4215/#4198.
- Source symptom: original Edge ignored final growth_events insert failure yet returned scan success; original injected CRO event producer did not classify /en/zelfscan and /en/frisse-blik in the registered scan-start stage.
- Observed 2026-11-11: 62 scans, 62 runtime refs, 4 missing expected commercial growth event, all four older anonymous Frisse Blik scans from August; 13 recent scans have all expected event IDs. Do not infer all four were caused by the current code version.
- Root: final consumer upsert promise was awaited but neither checked nor independently fetched; path matching lacked an exact EN branch and downstream start did not require same-site host.
- Fix: same scan idempotency key; verified growth readback and clear 503 on failure; truthful unknown attribution; exact NL/EN safe CTA routes and no cross-domain false start. Original state/Brain code is not duplicated.
- Safety: no synthetic paid revenue/lead, no PII in aggregate event, no new sales emails, scheduler or consent change; anonymous scan remains outside authenticated tenant state pending secure claim.
- Regression: original scan suite, `tests/brain-scan-price-portal-one-loop-20261111.test.mjs`, `tests/seo-order-measurement.test.mjs`.
- Release: protected GitHub Required/BRAIN/CodeQL + exact Netlify READY plus original Supabase Edge deployed version and independent production readback; unobserved external/customer outcomes stay EVIDENCE_DUE. Rollback: original protected source revert via same lease/CI.

- Directe historische hersteluitvoering 2026-11-11: 4 records in originele `growth_events` idempotent uit `scan_inzendingen` en bestaand runtime-ID gereconcilieerd. Readback 62/62 exact scan-ID/event-type, 0 missing; anonieme original source, ouderdom behouden en expliciete auditpayload, geen commercieel of causaal succes geclaimd.
