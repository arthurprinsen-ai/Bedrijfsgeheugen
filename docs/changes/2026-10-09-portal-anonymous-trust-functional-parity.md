# Fix obsolete anonymous protected-workspace expectations in Portal V2 browser suites

## Verified live failure
Netlify immutable PR preview for #4227, commit `7e3c9066a557a7125c30ec7bb451a5a621f0dc40`, failed exact-head browser run `37890400632` (3 failed, 9 passed). Both `portal-v2-functional-parity.spec.js` and `portal-v2-legacy-algorithm-parity.spec.js` expected the protected `compliance-governance` workspace to appear under anonymous preview access. The Portal V2 security contract correctly denies it. Consequently, the approved visual artifact was not produced, blocking the production visual-baseline chain for #4227.

## Corrective change
- Keep anonymous editable page coverage and mobile control checks for accessible workspaces.
- Exclude `compliance-governance` from the anonymous positive fixtures only.
- Add explicit negative assertions for protected route and workspace in both suites; retain full signed-in compliance E2E as an independent obligation.
- No security, tenant runtime, authorization, UI or source data change; no new agent or scheduler.

## Acceptance
Exact-head Netlify preview browser parity, protected Required and CodeQL checks, protected merge, exact-main production release and DOM readback. CSRD legal applicability and authenticated real-customer two-tenant write-to-Brain proofs remain open in parent #4215.
