# Resource & Sustainability Governor — visibility contract drift correction

- Date: 2026-09-19
- Obligation: `BG-RESOURCE-SUSTAINABILITY-20260919-01`
- Successor of: PR #2357
- Fingerprint: `resource-governor|website-visibility|test-contract-drift|v1`

## Incident

The stricter website release baseline made full public-page visibility fail-closed for every browser-verified release. Two fast-terminal regression tests still asserted the previous speed shortcut and caused BRAIN backend to fail after merge.

## Correction

The successor keeps the stricter production workflow unchanged and updates the regression contracts instead:

- fast-fix still uses bounded targeted route proof;
- `public-visibility` remains mandatory;
- the public visibility browser step is asserted as unconditional;
- the high-risk-only header/menu and broad browser suites remain scoped.

## Prevention

When speed/cost optimization and a stronger safety invariant conflict, tests must move to the stronger invariant. Optimization tests may verify bounded work only where they do not weaken canonical outcome protection.
