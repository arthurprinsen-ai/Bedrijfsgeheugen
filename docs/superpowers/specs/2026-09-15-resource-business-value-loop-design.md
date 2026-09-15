# Resource → Business Value Loop Design

**Fingerprint:** `powerhouse-resource-business-value-v1`

## Goal
Close the existing Powerhouse resource-footprint chain into a measurable business loop without creating a second ledger, CRM, ranking engine, or learning system.

Target chain:

`resource usage → impact → cost → business activity/action → outcome → realized value → forecast error → learning/calibration → next-best-action`

## Existing authorities reused
- `public.brain_budget_usage`: canonical raw resource/cost usage authority.
- `public.powerhouse_resource_factors`: versioned impact-factor authority.
- `public.powerhouse_resource_impact_v1`: resource→environmental-impact projection.
- `public.powerhouse_action_economics`: action economics authority for provider/external cost and human minutes.
- `public.powerhouse_sales_actions`: action authority.
- `public.powerhouse_sales_outcomes`: realized commercial outcome authority.
- `public.powerhouse_forecasts` / `public.powerhouse_forecast_calibration`: forecast/calibration authorities.
- `public.powerhouse_commercial_next_best_action_v3`: commercial NBA authority.
- `public.powerhouse_portal_resource_summary_v1`: portal resource summary authority.

No Make dependency. No parallel database or shadow learning store.

## Current gap
`powerhouse_action_economics` exists but currently has no observations, while resource usage currently lacks action/opportunity/campaign attribution. Therefore resource impact and commercial outcome cannot yet be joined into one evidence-backed value loop.

## Design
### 1. Additive usage context
The existing AI usage writer remains backward compatible. Canonical writes may add optional metadata only:
- `tenant_id`
- `activity_type`
- `action_id`
- `opportunity_key`
- `campaign_key`
- `outcome_key`

Absence is allowed and means `unattributed`, never an invented relation.

### 2. Canonical action business-value projection
Create `public.powerhouse_action_business_value_v1` as a security-invoker view. It joins existing authorities only and exposes, per sales action when evidence exists:
- provider and external cost from `powerhouse_action_economics`;
- human minutes and optional human cost only when an explicit hourly-rate basis exists in evidence;
- attributed resource amount and environmental impact from `brain_budget_usage` / `powerhouse_resource_impact_v1`;
- expected action/opportunity value;
- realized revenue from `powerhouse_sales_outcomes`;
- total observed cost, realized net value and realized ROI when denominator is known and >0;
- environmental factor coverage and resource-attribution coverage;
- provenance/confidence/readiness status.

Unknown values remain NULL/unknown. Zero is only emitted for a dimension when zero is an actually observed value.

### 3. Value-aware action ranking
Do not replace `powerhouse_commercial_next_best_action_v3`. Add `public.powerhouse_commercial_next_best_action_v4` over v3. v4 adds historical economics/resource evidence where available and computes an efficiency evidence component. Unknown economics is neutral, not punitive. Commercial progression, contact pressure, eligibility and truth gates remain authoritative.

### 4. Portal summary
Extend the existing portal resource summary through a new versioned projection rather than silently changing semantics. `powerhouse_portal_resource_summary_v2` adds:
- observations;
- environmental coverage;
- action-attribution coverage;
- observed provider/external cost;
- realized revenue linked to attributed actions;
- realized ROI only when cost evidence is sufficient;
- latest observed timestamp.

### 5. Learning/calibration
The business-value projection is read-only. Existing forecast/outcome/calibration writers remain authoritative. Future learning workers may use realized-vs-expected value and cost deltas, but this release does not create a second calibration mechanism.

## Truth and safety rules
- Unknown impact is never zero.
- Unknown cost is never zero unless explicitly observed as zero.
- No fabricated AI CO₂e/water/energy factors.
- No cross-tenant attribution without explicit tenant metadata or existing action authority.
- No prompts/answers/customer content copied into the resource ledger.
- Existing `tokenMetering` API status remains unchanged; new context is additive.
- New views are server-side/security-invoker and do not widen anon/authenticated access.

## Success criteria
A controlled action can be traced through existing canonical authorities from action/resource usage to economics and outcome, producing deterministic business-value/coverage fields. Production evidence must include schema/readback, tests, merge SHA, Netlify production SHA, production-release readback and canonical Powerhouse/Notion writeback.
