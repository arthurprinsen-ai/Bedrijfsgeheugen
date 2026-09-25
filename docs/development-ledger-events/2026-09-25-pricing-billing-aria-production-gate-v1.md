# Production browser gate — billing ARIA semantics

- Date: 2026-09-25
- Obligation: pricing-i18n-production-browser-proof-aria-v1
- Delivery lane: automation
- Classification: production verification / accessibility semantics
- Root cause: the production browser verifier asserted `aria-selected` for billing controls that are implemented as toggle buttons in a `role="group"`. The production UI correctly exposes selection through `aria-pressed`.
- Fix: verify the yearly billing toggle through `aria-pressed="true"` while retaining the existing assertion that the visible price changes.
- Prevention: production browser gates must verify the ARIA state appropriate to the control role instead of forcing an incompatible attribute into production markup.
- Evidence: Production Source Snapshot run 36155298640 proved exact SHA `c1bde3d41551724f7eaa9e2756d817e8c5e9f236` live, then failed only at the mismatched yearly billing assertion.
- Terminal rule: no green/live claim for the delivery workflow until the corrected verifier passes against production.
