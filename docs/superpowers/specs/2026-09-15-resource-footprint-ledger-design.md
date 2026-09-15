# Resource Footprint Ledger Design

## Goal
Extend the existing Portal V2 `CSRD & Impact` capability with one Powerhouse resource-footprint chain. Reuse canonical raw usage and existing AI token metering; do not introduce a parallel brain, portal, analytics store or learning system.

## Canonical architecture
1. `brain_budget_usage` remains the append-only authority for raw cost/resource usage facts.
2. `powerhouse_resource_factors` stores versioned factor records with resource type, unit, provider/source scope, optional model/geography scope, validity, methodology, source reference and confidence.
3. `powerhouse_resource_impact_v1` derives energy (kWh), CO2e (kg) and water (litres) per raw usage fact. Missing factors or missing dimensions remain `unknown`/NULL; never fabricate zero.
4. `platform/cost/ai-token-usage.mjs` reuses existing provider token metadata and can apply the same canonical factor shape deterministically. No prompts or responses are retained by footprint calculations.
5. Existing `portal-v2/csrd-impact.js` accepts a resource-footprint snapshot. It switches from the explicit `Voorbeelddata · geen live claim` state to `Data-backed` only when coverage is positive; internal view exposes coverage/confidence/factor lineage.
6. Powerhouse `brain_records` and the human handbook receive release/evidence writeback. Notion is documentation projection, not runtime authority.

## Governance
- EXISTING-STATE-FIRST / REUSE-FIRST / CANONICAL-INTEGRATION / CLOSED-LOOP.
- No Make dependency. Retired Make usage and synthetic historic usage are excluded from the current impact projection.
- Provider-reported/measured usage and estimated impact remain semantically separate.
- A factor is usable only inside its validity interval and matching resource/unit/provider/model scope.
- Factor records require explicit methodology and confidence. Unsupported or insufficiently evidenced factors are not guessed.
- `powerhouse_resource_factors` has RLS. `powerhouse_resource_impact_v1` uses `security_invoker` and has no direct `anon`/`authenticated` grants.

## Calculation
For each matched resource usage event:

`impact = usage_amount / quantity_basis * factor_value`

The formula applies independently to `energy_kwh`, `co2e_kg` and `water_liters`. A missing factor value produces NULL for that dimension.

## Tenant and provenance contract
New usage producers include stable usage identity, tenant/company scope in canonical metadata, source/provider, resource type, unit, quantity, event time and evidence/provider usage identity where available. The current projection uses explicit tenant metadata and only falls back to `canonical` for platform-wide facts.

## Portal behavior
The existing CSRD layout, actions and domain navigation stay intact. `withResourceFootprint()` enriches the current snapshot rather than creating a second CSRD model. Customer-safe projection hides internal evidence while preserving safe aggregate values.

## Tests
Tests prove: fail-closed unknown factors, compatibility with the database factor shape, deterministic calculations, idempotent aggregation, explicit example-state behavior and data-backed CSRD rendering.

## Delivery
TDD branch -> GitHub required gates -> exact tested merge -> production deploy -> production readback -> Powerhouse `brain_records` verification -> Notion handbook update. No `LIVE & BEWEZEN` claim before all stages are green.
