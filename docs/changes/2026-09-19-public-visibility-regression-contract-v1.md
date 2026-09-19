# Universal public-visibility regression contract

- Obligation-ID: website-public-visibility-regression-contract-v1
- Incident: unrelated backend/security delivery failed because `tests/brain-fast-terminal-delivery-v2.test.mjs` still expected public visibility only on high-risk website releases.
- Canonical main already requires public visibility for fast-fix preview work and executes the visibility step without a risk-only condition.
- Fix: historical replay now asserts universal public visibility while retaining high-risk-only header-menu and broad browser contracts.
- Prevention: safety hardening and replay expectations must change in the same lineage.
- Status: RECOVERABLE_INCOMPLETE until exact-head Required/BRAIN/CodeQL/Skill Projection and protected merge are green.
