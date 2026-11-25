# Foresight scenario direction recovery · 2026-10-15

Follow-up to Powerhouse Foresight #4420 and merged PR #4423.

## Defect
An assumed +10% change raised every KPI, including those where lower is desirable, such as risk and annual manual hours. For a negative EBITDA-margin baseline, a positive scenario could also produce a worse number.

## Bounded correction
Interpret the sensitivity control as an explicitly *favourable / adverse what-if assumption*, respecting the goal's `direction` metadata from the existing canonical Brain goal registry. Positive sensitivity moves up-goals upwards, down-goals downwards. The impact size uses the absolute baseline magnitude so an upward target with negative starting value is improved rather than worsened.

No additional customer data, endpoint, scheduler, model provider, or unverified prediction is introduced. Assumptions are still **not causal**, and the optional band remains a statistical indication not independently validated.

## Verification
- Native Portal V2 regression with both `up` and `down` goal directions and negative baseline.
- Canonical Brain learning replay.
- Required CI, CodeQL, protected merge, customer-authenticated production acceptance remain mandatory.
