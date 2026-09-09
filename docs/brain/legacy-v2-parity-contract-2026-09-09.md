# Legacy → Portal V2 parity contract — 2026-09-09

Status: VERIFIED / production-live baseline.

## Production baseline

The verified Portal V2 production baseline for the legacy businesscase parity release is commit `a65b8d5c750e8ea24803e2c1b1baa288665b9666` (PR #1296). The production DOM readback for this exact SHA completed successfully.

## Immutable parity rules

Portal V2 must preserve the final legacy portal semantics unless an explicitly approved product change replaces them.

### Profile / maturity calculation

- 13 maturity dimensions are part of the current parity contract.
- Missing maturity values default to level 2.
- Legacy maturity factors are `[1, 0.78, 0.50, 0.22, 0.06]` for levels 1–5.
- Weekly manual-work weights remain the legacy values, including `service=2.0`, `security=2.0`, `duurzaam=2.0`.
- Annualization uses 46 productive weeks.
- FTE conversion uses 1,600 productive hours per FTE/year.
- Capacity is presented as recoverable capacity/space, not automatically as cash savings.

### Businesscase calculation

Businesscase value is calculated per maturity dimension, not by multiplying total current cost by one global target factor.

For each dimension:

1. determine current maturity;
2. determine target maturity as `max(current, selected target)` so an already-mature dimension is never degraded;
3. calculate current annual manual cost using that dimension's legacy weekly-hour weight and current maturity factor;
4. calculate target annual manual cost using the same base and target maturity factor;
5. annual benefit is `max(current annual cost - target annual cost, 0)`.

Derived values:

- delay cost = annual benefit / 12 × delay months;
- payback = investment / monthly benefit when monthly benefit > 0;
- 3-year net result = annual benefit × 3 - investment.

Legacy businesscase defaults and controls:

- target maturity: 4;
- target control range: 2–5;
- delay: 12 months;
- delay range: 0–18 months, step 3;
- investment: €12,000;
- investment control starts at €1,000 with €1,000 steps.

### 70% realizability rule

The legacy `× 0.7` realizability factor belongs to the execution ladder / realized-potential calculation only. It must not be applied to the businesscase annual potential.

## Regression contract

The following tests are release obligations, not optional examples:

- `portal-v2/tests/legacy-calculation-golden-master.test.mjs`
- `portal-v2/tests/legacy-businesscase-golden-master.test.mjs`

A future Portal V2 change that alters these outcomes must either:

1. keep the golden masters green; or
2. explicitly document and approve a deliberate product-semantic change before changing the expected values.

Repository/unit success alone is not sufficient production evidence. Portal V2 parity changes remain accepted only after exact-candidate verification and a successful production readback on the deployed main SHA.

## Learning / operating rule

When legacy→V2 parity is questioned, do not infer parity from page presence, field mappings or model names. Compare executable behavior against the final legacy implementation with discriminating fixtures. Any discovered drift must follow RED → minimal fix → GREEN → merge → exact production readback, and the resulting rule must be written back into Brain.
