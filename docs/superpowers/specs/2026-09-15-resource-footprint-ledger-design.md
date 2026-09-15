# Resource Footprint Ledger Design

## Goal
Extend the existing Portal V2 `CSRD & Impact` capability with a single tenant-aware resource footprint ledger that reuses Powerhouse runtime and AI token usage data and makes every sustainability metric traceable to source, period, methodology, factor version and confidence.

## Invariants
- EXISTING-STATE-FIRST / REUSE-FIRST / CANONICAL-INTEGRATION / CLOSED-LOOP.
- No Make dependency and no parallel portal, analytics store, learning store or sustainability brain.
- Raw usage and derived impact stay distinct.
- Provider-measured facts are never presented as estimated and estimates are never presented as measured.
- No prompt/content payloads are stored for AI usage; only metering metadata.
- Customer view hides internal evidence detail while internal view exposes provenance and confidence.
- Missing factors or incomplete source coverage fail closed into `unknown`/`partial`; never fabricate zero impact.

## Architecture
1. Existing runtime/provider usage remains the source of raw usage facts, including `platform/cost/ai-token-usage.mjs`.
2. `portal-v2/resource-footprint.js` normalizes resource events and derives footprint values using versioned factors supplied as data, not hidden constants.
3. Portal state exposes the resource footprint snapshot to the existing `csrd-impact.js` renderer.
4. Supabase stores raw resource usage events, factor versions and calculated footprint snapshots with tenant, source, period, methodology, confidence and evidence metadata.
5. RLS is enabled on all new tables. Service-role ingestion is separated from authenticated tenant reads.
6. Portal V2 `data-sources.js` reports resource footprint coverage as a first-class Powerhouse source.

## Supported resource classes
- AI inference: token counts, calls, provider/model metadata; energy/CO2e/water only when a versioned factor exists.
- Cloud/SaaS/API: provider-reported units such as compute time, requests, transfer, storage or vendor-emitted carbon data.
- Facilities/business operations: electricity, gas/fuel, water, waste and travel when imported by existing connectors or tenant input.

## Provenance contract
Every raw event contains: tenant id, event id/idempotency key, source/provider, component, resource type, quantity, unit, period/timestamp, evidence reference and measurement class (`measured`, `provider_reported`, `estimated`). Every derived impact contains the raw event identity, factor set/version, methodology, resulting energy/co2e/water values, confidence and calculation timestamp.

## Factor governance
Emission/energy/water factors are versioned records with source URL/citation field, valid-from/valid-to dates, geography/provider/model scope, unit basis and confidence. A calculation may only use a factor whose scope and validity match the usage event. Unknown factor means impact remains unknown.

## Portal behavior
`CSRD & Impact` keeps its existing layout. When footprint data exists it replaces example real-time values with data-backed values and shows coverage, source class and last calculation. If no live footprint data exists, current example labels remain explicit and no live claim is made. Internal view adds factor version and provenance summary; customer view only exposes safe aggregate metrics.

## Tests
Node tests cover idempotent normalization, factor matching, deterministic calculations, unknown-factor behavior, measured-vs-estimated labeling, tenant aggregation and customer-safe projection. Existing portal regression tests must remain green.

## Delivery
Branch -> failing tests -> implementation -> GitHub required test -> merge -> Supabase migration -> Netlify/GitHub production deployment -> public Portal V2 readback -> Powerhouse/Notion writeback with exact commit and evidence.