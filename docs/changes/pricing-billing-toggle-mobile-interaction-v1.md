# Pricing billing toggle and mobile interaction

## Problem
On mobile the pricing direction controls did not create a clear visible state change and the annual billing option was absent. Floating conversion UI could overlap pricing content and undermine tap reliability.

## Change
- Restored an accessible **Maandelijks / Jaarlijks** billing control.
- Annual prices use ten monthly payments: Control € 14.950/year, Scale € 24.950/year, Enterprise from € 49.950/year.
- Direction controls now actually switch between the Start and Run plan groups.
- Pricing controls and CTAs get explicit mobile touch/pointer priority and minimum tap height.
- Production/build contracts now require the deliberate billing toggle while still rejecting the old hidden `.jr` annual residue.

## Verification
`tests/brain-pricing-content-normal-production-readback-v1.test.mjs` protects the toggle, annual values and mobile interaction contract. Exact-head production readback remains required before closure.
