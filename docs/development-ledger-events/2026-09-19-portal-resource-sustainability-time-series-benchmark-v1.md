# Resource & Sustainability dashboard — activity ledger

- **Date:** 2026-09-19
- **Obligation-ID:** `BG-20260919-RESOURCE-SUSTAINABILITY-DASHBOARD-V1`
- **Learning fingerprint:** `portal-resource-sustainability-time-series-benchmark-v1`
- **Delivery lane:** Portal V2
- **Implementation PR:** #2362
- **Exact candidate:** `80bf2f1daf71c87a79b7af57949cc9e4546be1f1`
- **Protected merge / current production commit:** `276efe38f8b5b9ca2332a09c19117900ea816ff2`
- **Netlify production deploy:** `6aae7eba4e189f000836f8f4`
- **Status at writeback:** production deploy ready; material writeback recovery in progress

## Request

Add one portal dashboard where resource consumption and sustainability can be selected, filtered, benchmarked and followed over time, including provider costs, CO2e, water, energy, AI tokens, credits and requests.

## Existing-state-first decision

The canonical resource telemetry and impact surface already existed. The change therefore extended the existing **CSRD & Impact** page and reused `public.powerhouse_resource_intelligence_daily_v1`; it did not create another portal, resource database, dashboard authority or impact ledger.

## Delivered capability

- selectable metrics: cost, CO2e, water, energy, tokens, credits and requests;
- 7/30/90-day and all-history windows;
- provider and resource-type filters;
- daily time-series;
- provider distribution;
- own-period average as an immediate baseline benchmark;
- provenance/evidence completeness;
- sector-benchmark drill-through without synthetic comparison numbers;
- responsive desktop/mobile layout.

## Truth and safety invariants

- unknown physical telemetry remains `NULL`, never zero;
- cost/token/credit/request units remain separated from physical-impact fields;
- external benchmarks require comparable evidence;
- physical-impact factors require provenance and confidence;
- intensity metrics are shown only when numerator and functional-unit denominator are evidence-backed.

## External research applied

FinOps unit economics supports expressing technology consumption/cost against meaningful activity or value units. Green Software Foundation SCI uses carbon impact per functional unit, while SEI uses energy per functional unit. WUE expresses water intensity in liters per kWh. These principles were used as design guidance only; no external benchmark value was copied into customer data.

## Verification evidence

- Portal V2 Tests: success on exact candidate.
- Portal parity gate: success.
- Portal V2 Live Preview: success.
- Portal V2 Production DOM Readback: success.
- Powerhouse CodeQL: success.
- Powerhouse Assurance: success.
- Powerhouse Quality Intelligence: success.
- Netlify production deploy is `ready` and points to merge SHA `276efe38f8b5b9ca2332a09c19117900ea816ff2`.

## Incident and learning

The original material candidate omitted two mandatory closure artifacts: Brain learning and an activity-ledger event. Required preflight correctly blocked terminal closure with `MATERIAL_WRITEBACK_CLOSURE_MISSING`. This recovery supplies both artifacts and records the prevention rule that material portal delivery must carry code/tests, documentation, Brain learning and activity-ledger evidence in one canonical lineage.

## Outcome

The Resource & Sustainability analytics capability is deployed in the canonical Portal V2 impact cockpit. This ledger event exists to complete the missing learning/writeback chain, not to introduce a second implementation.
