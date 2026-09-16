# Powerhouse Observability → Outcome → Calibration Closure Design

**Date:** 2026-09-15  
**Fingerprint:** `powerhouse-observability-outcome-calibration-closure-v1`  
**Parent capability:** `powerhouse-resource-business-value-v1`  
**System:** Bedrijfsgeheugen Powerhouse / Bedrijfsgeheugen Growth & Revenue Operating System

## 1. Purpose

Close the remaining gap between a technically live Resource → Business Value architecture and an autonomously improving Powerhouse that learns from real, attributable operating evidence.

The target closed loop is:

`provider/runtime usage → canonical resource/cost usage → action/opportunity attribution → human feedback → reply/meeting/proposal/win/loss/revenue → realized business value → forecast error → calibration → Next Best Action → Portal → next observed outcome`

The objective is not to create another telemetry, CRM, analytics, learning, sustainability or NBA subsystem. Existing Powerhouse authorities remain canonical and are extended only where evidence is currently missing.

## 2. Architectural principles

All implementation must obey:

- `EXISTING-STATE-FIRST`
- `REUSE-FIRST`
- `CANONICAL-INTEGRATION`
- `CLOSED-LOOP`
- No Make dependency.
- No parallel database, CRM, outcome ledger, learning plane, queue, calendar, analytics store or ranking engine.
- Stable public/runtime contracts are extended additively; existing meanings are not silently redefined.
- Unknown cost, environmental impact, resource use or business value remains `NULL`/unknown, never fabricated as zero.
- Only explicit tenant/action/opportunity/outcome attribution can influence realized-value calculations.
- Cross-tenant ambiguity fails closed.
- Forecast/calibration/NBA influence remains neutral until minimum observed-evidence requirements are satisfied.
- Production status requires exact-SHA provider/runtime/readback evidence, not code presence alone.

## 3. Existing authorities to reuse

The design keeps these existing stores/views/functions as authority:

- `brain_budget_usage` — canonical raw resource/usage observations.
- `powerhouse_resource_factors` — versioned impact factor registry.
- `powerhouse_resource_impact_v1` — fail-closed resource impact projection.
- `powerhouse_action_economics` — observed provider/external cost and human minutes.
- `powerhouse_action_business_value_v1` — action-level resource/cost/value projection.
- `powerhouse_sales_actions` — canonical commercial action records.
- `powerhouse_sales_outcomes` and existing growth/outcome stores — replies, meetings, proposals, wins/losses and realized revenue where already supported.
- `powerhouse_forecasts` and `powerhouse_forecast_calibration` — forecast and calibration authority.
- `powerhouse_commercial_next_best_action_v3` — existing canonical commercial ranking/decision authority.
- `powerhouse_commercial_next_best_action_v4` — additive observed-economics enrichment, not a replacement decision engine.
- Existing Powerhouse learning/error/outcome/calibration lineage.
- Existing Portal/Portal V2 canonical data and assurance contracts.
- Existing approved-central blog/publication path and its open obligation; no alternative publication route.

## 4. Scope

This closure has four tightly coupled delivery areas.

### 4.1 Automatic resource and cost attribution

Extend existing provider/runtime usage writers so that, where the caller has verified context, the following identifiers are propagated into canonical usage/economics evidence:

- `tenant_id`
- `activity_type`
- `action_id`
- `opportunity_key`
- `campaign_key`
- `outcome_key`
- existing correlation/request/provider identifiers
- existing measurement class / source / provider-model identity

Rules:

1. Context is allowlisted and validated; arbitrary request metadata is not promoted into canonical attribution.
2. Prompts, AI answers, customer free text and other content payloads are not copied into resource metering.
3. Existing `tokenMetering` semantics remain unchanged; canonical attribution is orthogonal.
4. Provider/platform collectors are added only where actual usage/cost evidence is accessible. Missing provider evidence stays unknown.
5. `powerhouse_action_economics` remains the monetary/time authority; no second cost ledger is introduced.

### 4.2 Outcome and human-feedback capture

Observed downstream evidence must flow through existing action/outcome/learning authorities.

Required outcome classes include, where provider or human evidence exists:

- sent/published/executed
- reply / no-reply after defined observation window
- meeting booked / meeting held
- proposal created / sent
- won / lost
- realized revenue
- cancellation / skip / hold
- human edit / override / rejection
- manual conversation/call where explicitly recorded

Rules:

1. Outcomes must reference the originating canonical action where an action exists.
2. Human intervention is first-class evidence, not an exception outside the learning loop.
3. Non-response is recorded only after an explicit observation window; provider silence is not automatically negative evidence.
4. Revenue is realized revenue only when explicitly observed. Forecast or proposal value is not revenue.
5. Loss reason, competitor, cost, customer intent or legal basis is never fabricated.

### 4.3 Evidence-gated forecast, calibration and NBA

Calibration must compare pre-action prediction to observed post-action outcome using existing forecast/calibration authorities.

Required behavior:

- Persist prediction before execution.
- Preserve the exact model/rule/version/confidence and decision context used for that prediction.
- Join observed outcomes only through explicit lineage keys.
- Calculate forecast error only when comparable predicted and observed measures exist.
- Keep sparse/unknown evidence separate from negative performance.
- Activate cost/resource-efficiency influence only after a defensible minimum evidence threshold.
- Keep existing NBA-v3 as decision authority; v4 or a successor projection may contribute observed economics/resource evidence without becoming a second ranking engine.
- Unknown environmental impact must never penalize an action.

Thresholds must be explicit and versioned in code/config rather than hidden magic numbers. Until thresholds are met, the efficiency/calibration contribution is neutral and its evidence status states why.

### 4.4 Portal V2 and publication-obligation closure

Portal V2 must consume the same canonical projections as the legacy portal/Powerhouse and must not reimplement business-value logic locally.

Portal behavior must expose, where applicable:

- measured resource quantities
- observed financial cost
- human effort
- environmental impact with factor/provenance/coverage/confidence
- realized revenue/value
- ROI only when mathematically supported by observed cost and realized outcome
- evidence class: `measured`, `provider_reported`, `estimated`, `unknown` as applicable
- coverage/freshness/confidence

Unknown values render as unknown/sample/insufficient evidence, never `0` unless zero itself is observed evidence.

The existing approved-central blogdelivery obligation remains a separate existing lane in the same release program. The implementation must diagnose and repair the row-visibility/token-authority mismatch without introducing an alternate queue, alternate Notion source or bypassing publication gates.

## 5. Data flow

### 5.1 Resource/economics path

`provider/runtime event`
→ existing metering/collector
→ `brain_budget_usage`
→ `powerhouse_resource_impact_v1`
→ explicit `action_id`/business-context join
→ `powerhouse_action_economics`
→ `powerhouse_action_business_value_v1`

### 5.2 Commercial outcome path

`powerhouse_sales_action`
→ provider/human execution evidence
→ existing outcome authority
→ reply/meeting/proposal/win/loss/revenue
→ `powerhouse_action_business_value_v1`
→ forecast/calibration comparison
→ NBA enrichment

### 5.3 Learning path

`prediction before action`
→ execution/readback
→ observed outcome
→ prediction error / economics / resource evidence
→ existing calibration/learning authority
→ next NBA/context update

### 5.4 Portal path

`canonical projections`
→ shared portal service/read model
→ legacy portal and Portal V2
→ tenant-scoped rendering
→ user interaction/writeback
→ existing Powerhouse event/outcome/learning loop

## 6. Truth and calculation semantics

### 6.1 Costs

For an action:

`observed_cost_eur = provider_cost_eur + external_cost_eur`

Only non-null observed components are included. If there is no observed cost evidence at all, the action's observed cost remains unknown rather than zero.

Human minutes remain a separate observed metric unless an explicitly governed labor-rate methodology exists. Human minutes must not silently be converted to euros using an invented rate.

### 6.2 Realized value

Where observed cost and realized revenue both exist:

`net_realized_value_eur = realized_revenue_eur - observed_cost_eur`

`roi_ratio = net_realized_value_eur / observed_cost_eur`

ROI is undefined when observed cost is zero/unknown or realized revenue is unknown. Division-by-zero and absent evidence return `NULL`.

### 6.3 Environmental impact

Environmental impact is calculated only from a valid factor whose resource type, unit, source/provider/model/geography and validity period match the observation according to the existing factor contract.

No generic per-token CO₂, water or energy factor may be invented. No factor means unknown impact.

### 6.4 Evidence maturity

Each action/value projection must be able to distinguish at least:

- `unknown` — required evidence absent.
- `partial` — some attributed observations exist but not enough to support realized-value/calibration influence.
- `measured` — sufficient observed resource/economics/outcome evidence exists for the metric being claimed.

A single label must not imply every dimension is measured. Dimension-level coverage remains visible.

## 7. Security and tenancy

- New/updated projections use `security_invoker=true` where the current Powerhouse pattern requires it.
- No broad browser-role grants are introduced.
- `public`, `anon` and `authenticated` access must not expand accidentally through new views or RPCs.
- Service-side writers validate tenant and business identifiers before canonical write.
- Cross-tenant joins require exact canonical tenant lineage; ambiguous records are excluded from learned business value.
- Existing `public.organisaties.id` tenant authority remains canonical.

## 8. Error handling and fail-closed behavior

- Canonical metering failure must not discard a valid provider response or existing local measurement when the current runtime contract deliberately separates them; instead mark canonical write state explicitly and generate an obligation/evidence record where appropriate.
- Invalid attribution identifiers are rejected or ignored according to the existing writer contract; they are never used heuristically.
- Missing factors/cost/outcomes produce unknown fields, not zeros.
- Missing prediction blocks forecast-error/calibration calculation; it does not create a synthetic backfilled forecast.
- Provider readback failures keep execution unresolved and deduplicated; no fake `published`, `sent`, `won`, `measured` or `learned` states.
- Publication repair must preserve identity/truth/quality/dedupe gates.

## 9. Testing strategy

Implementation follows TDD.

Minimum automated coverage:

1. Metering context allowlist and stable contract preservation.
2. Unknown cost/resource/environmental fields remain null.
3. Explicit action attribution succeeds; missing/ambiguous/cross-tenant attribution fails closed.
4. Observed revenue + observed cost produce deterministic net value/ROI.
5. Missing cost or revenue does not produce ROI.
6. Human skip/edit/override is captured as feedback evidence without being reinterpreted as a positive/negative sales outcome.
7. Forecast error requires a pre-existing prediction.
8. Calibration/NBA efficiency remains neutral below the configured evidence threshold.
9. Security contract validates `security_invoker` semantics and no browser-role grant expansion.
10. Portal rendering distinguishes measured/provider-reported/estimated/unknown and never renders unknown as zero.
11. Blogdelivery repair reproduces the Notion/provider visibility failure in a controlled test and verifies the existing approved-central route after the fix.
12. Release classifier recognizes every changed path without weakening governance.

## 10. Production verification

Before `LIVE & BEWEZEN`, the release must prove all of the following:

1. Required + BRAIN green on the exact release head.
2. Supabase migrations/functions applied and catalog/security/grants read back.
3. A transaction-scoped production fixture demonstrates:
   - resource/usage attribution to one canonical action;
   - observed economics;
   - observed outcome/revenue;
   - deterministic realized value and ROI;
   - forecast/calibration eligibility behavior;
   - environmental impact remains null when no factor exists;
   - fixture leaves zero residual test data after rollback/cleanup.
4. Existing real production data is read back separately from the fixture to report actual coverage and evidence maturity.
5. Protected merge onto current `main` with exact expected candidate SHA.
6. Netlify production deploy `ready` on the exact merge/main SHA.
7. Production Release Readback `success` on that same SHA.
8. Portal/Portal V2 production readback for affected views/routes where user-facing behavior changes.
9. Approved-central blogdelivery provider/readback evidence if that obligation is fixed in the same release; otherwise the whole program cannot claim globally closed status and must retain one exact blocker obligation.

## 11. Canonical writeback and documentation

After production proof:

- Update/create the relevant `brain_records` current-state verification using existing allowed record kinds.
- Write one deduplicated Learning record for any new root cause/prevention not already covered.
- Reuse existing branch-drift learning if drift occurs; do not duplicate it.
- Update the Powerhouse Human Handbook with data flow, formulas, evidence maturity, thresholds, provider coverage and current truth state.
- Update the Master Build/Borging/Go-Live Register with exact PR/head/merge/deploy/readback IDs and remaining evidence gaps.
- Update the Canonical System Map if component relationships, provider routes, gates or lineage changed.
- Update specialist portal/publication documentation only where the actual architecture changed.

## 12. Explicit non-goals

This design does **not**:

- create a new CRM or opportunity store;
- create a new resource/sustainability ledger;
- replace NBA-v3 with a new ranking engine;
- invent environmental conversion factors;
- infer human labor rates without governance;
- fabricate outcomes or backfilled forecasts;
- move runtime truth into Notion;
- reintroduce Make;
- treat a calendar entry, merge, deploy or HTTP 200 as business outcome proof.

## 13. Delivery decomposition

The implementation plan should execute in this order so every phase reuses the previous proof:

1. **Attribution foundation** — provider/runtime usage and economics context propagation.
2. **Outcome + human-feedback closure** — canonical downstream evidence and lineage.
3. **Forecast/calibration/NBA gating** — observed-evidence thresholds and neutral unknown behavior.
4. **Portal consumption** — canonical business-value/coverage projection in Portal V2 with parity checks.
5. **Approved-central blog obligation repair** — diagnose/fix existing visibility/authority mismatch only through the existing route.
6. **End-to-end production proof** — transaction fixture + real-data readback.
7. **Protected release** — exact-head gates, merge, exact-SHA Netlify and production readback.
8. **Canonical writeback/documentation** — runtime VERIFIED state, learning, Handboek, Master Register, System Map.

If an independent external provider lacks an API/authority required for real usage or outcome collection, that provider remains explicitly `unknown/unavailable` and is tracked as a deduplicated coverage obligation; it must not block unrelated providers from being measured.

## 14. Definition of done

This program is `LIVE & BEWEZEN` only when:

- the new/extended collectors and projections are active in production;
- exact tenant/action/opportunity/outcome attribution is proven;
- at least one transaction-scoped end-to-end fixture proves usage → cost → action → outcome → realized value → calibration eligibility with complete cleanup;
- actual production coverage is reported separately and honestly;
- unknown dimensions remain unknown;
- all touched security/release gates are green;
- affected Portal V2 behavior is production-read back;
- the approved-central blog obligation is either closed with provider evidence or retained as the single explicit blocker preventing a claim that the entire wider Powerhouse is globally closed;
- exact merge/main/Netlify/readback identities match;
- Powerhouse runtime, learning and human documentation are updated and read back.
