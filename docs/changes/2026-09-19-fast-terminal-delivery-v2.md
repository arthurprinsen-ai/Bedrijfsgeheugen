# Fast terminal delivery v2 — change record

- Obligation-ID: powerhouse-fast-terminal-delivery-v2
- Optimizes the complete path from candidate admission to protected merge and terminal production proof.
- Cheap admission, metadata, classifier and security checks remain fail-fast.
- Independent expensive gates may run in parallel after admission.
- Healthy exact-head gate results are reused rather than duplicated.
- Main drift is coalesced into one freshest-main terminal reconciliation.
- A known failed historical canonical production readback now falls through immediately to authoritative current-production descendant proof.
- Exact-head, CodeQL/security, behind_by=0 at landing, protected merge, production/provider readback and canonical learning/skill writeback remain mandatory.
- Redirect-only `netlify.toml` changes are now machine-classified as bounded fast-fix work; they no longer trigger full-site visibility/header/browser sweeps.
- Terminal closure now independently requires latest exact-head Required + BRAIN + applicable Powerhouse CodeQL success before it may persist `LIVE_BEWEZEN`.
- The release-control-plane regression now encodes the intended risk budget: redirect-only fast-fix uses targeted route proof; broader changes retain public visibility/full checks.
- Normal-risk website changes now use targeted affected-route browser proof; sitewide visibility/header crawls are high-risk-only.
- `data/regelgeving.json` is explicitly mapped to `/`, `/ai-act`, `/compliance-status`, `/benchmark` and `/monitor`.

## Regression-oracle alignment

The terminal-readback policy now has matching historical oracles: a historical non-green canonical readback may not itself count as success, but it may fall through to an independently verified current-production descendant proof. That proof still requires merge ancestry plus the production BRAIN contract/authority, deploy identity, runtime and connector-readiness evidence. The older cancelled-only assertions were removed because they contradicted the already adopted fast-terminal authority.
