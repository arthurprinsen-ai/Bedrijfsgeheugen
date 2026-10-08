# Portal authentication evidence freshness — delivery ledger

Obligation: portal-auth-evidence-freshness-guard-v1

Changes: enforce evidence freshness within existing Required CI; remove redundant workflow; downgrade two historical LIVE_PROVEN claims because six protected runtime paths changed after the prior production proof. Preserve prior proof for audit.

Verification: regression tests in tests/portal-auth-evidence-freshness.test.mjs; protected Required and CodeQL must pass on the exact PR HEAD before merge. New authenticated production proof remains required before claims can return to LIVE_PROVEN.
