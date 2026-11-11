# 11 November 2026 — scan, prices and portal: one original evidence-based chain

**Parent:** #4215 (customer state/external data), **related:** #4198 (commercial conversion/outcome). Fingerprint: `portal|scan-pricing|growth-event-silent-non-ack-and-en-funnel-gap|20261111-v1`.

## Verified source defect and database baseline

Original Supabase `powerhouse-scan-ingest` stores a scan in `scan_inzendingen`, then stores and reads back the original `powerhouse_runtime_events` row, but **ignored the error and acknowledgement** from the terminal `growth_events` upsert. It could return `ok:true` despite that final commercial consumer never storing the scan. Direct original Supabase readback on 2026-11-11 observed 62 original scans, 62 with a `powerhouse_event_id`, 4 missing expected `growth_events.event_id='scan:'||submission_key` (four anonymous August `frisse_blik` records). The recent 14-day subset had 13 scans and 0 missing growth events. Historic missing rows are not proof of current systemic failure, but demonstrate an actual source-to-growth gap.

The original single injected website CRO producer in `tools/seo-order-engine/measurement.mjs` recognized only NL paths for unmarked links and extra `selfscan_start`/`frisse_blik_start`. Its NL+EN positioning produces real `/en/zelfscan` links; on English pricing and home pages, one click could be missing the registered scan-start stage. An explicit marked cross-domain scan link could also yield a false scan-start based on path alone.

## Scoped original-owner correction

- Keep exactly the same public `/api/powerhouse-scan-ingest` proxy → original protected Supabase Edge → original `scan_inzendingen` / `powerhouse_runtime_events` / `growth_events` tables and `scan:${submission_key}` idempotent event ID.
- Return `ok:true` only after **independent existing-table** `growth_events` readback of matching event ID/type/scan ID. Return 503 `SCAN_GROWTH_HANDOFF_FAILED` or `SCAN_GROWTH_HANDOFF_UNCONFIRMED` with `retryable:true` when missing. Existing client retry preserves the same idempotent key; **never** emit a new email, buyer identity, amount or second scan. Expose `growth_event_id` and `growth_event_readback_proven` only on true ACK. Source-only and Brain runtime ACK do not assert actual Heartbeat learning.
- The scan producer does not know organic acquisition; store `medium:'unattributed'` instead of fabricating SEO traffic. Never forward PII from workshop intake to aggregate growth events.
- The existing public CRO producer recognizes exact NL/EN local routes for pricing, checkout, scan, contact and signup; for locally owned scan routes emits exactly one `selfscan_start` or `frisse_blik_start`. Cross-origin lookalikes are excluded even if a CTA is explicitly tagged. Preserve the first-party original producer, consent restrictions and browser automation no-measure rule.
- Authenticated Portal V2 customer fields remain in the original tenant-scoped state/BusinessInput/ONE BRAIN writer; the anonymous scan is **not** an authorized customer field until authenticated source claim. External connector metadata is **not** a verified data readback, and pricing clicks are **not** orders.

## Verification and prevention

Tests: `tests/brain-scan-price-portal-one-loop-20261111.test.mjs`, original `tests/seo-order-measurement.test.mjs` including two locales/no double-sends/cross-host fake scan starts, plus original scan, privacy and portal suites. The machine learning record uses this existing Brain test in historical/shadow/canary.

Protected hygiene/lease → Required/BRAIN/CodeQL → published matching current Netlify SHA + real browser readback. The Edge file must be deployed through the original `powerhouse-scan-ingest` Edge authority at exact new main source and independently read back as ACTIVE source-matching version; GitHub merge/Netlify READY do not themselves prove an Edge deployment. All four releases require actual authorized external data, at least two separate real tenant customer traces, provider actions, matured CRO treatment and holdout, measured impact and applied Heartbeat learning before claiming FULL_GREEN. No new cron, data store, customer agent, provider sender or parallel Powerhouse.
