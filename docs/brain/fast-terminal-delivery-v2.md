# Fast terminal delivery v2

Obligation: `powerhouse-fast-terminal-delivery-v2`.

The Powerhouse delivery control plane now optimizes the complete critical path to terminal proof, rather than optimizing only coding or PR creation. Cheap admission/classifier/security gates remain first. Independent expensive work fans out after admission. Healthy exact-head jobs are reused. Main movement is coalesced into one current-main reconciliation at the terminal landing boundary. Historical failed production-readback runs no longer force an immediate recovery failure: the closure workflow proceeds to authoritative current-production descendant proof.

Safety is unchanged: exact-head identity, branch protection, CodeQL/security, `behind_by = 0` at landing, production/provider readback, learning/writeback and skill projection remain mandatory.

## Route-sensitive browser budget

The website lane now distinguishes an append-only canonical 301 redirect block in `netlify.toml` from real Netlify build/header/security configuration changes. Redirect-only candidates use baseline + exact preview + targeted route browser proof. Full public-page visibility, header contrast and broad visual regression remain mandatory for broader/high-risk website changes. Brain learning, docs and `tests/brain-*` closure evidence no longer inflate website blast radius.

