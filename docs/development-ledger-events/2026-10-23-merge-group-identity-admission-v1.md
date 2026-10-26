# Merge-group authority — development ledger 2026-10-23

Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4661
Fingerprint: `github|merge-group|run-id-spoofed-as-pr-and-manifest-fallback|20261023-v1`
Obligation: `github|merge-group|immutable-identity-and-unverified-scope-rejection|20261023-v1`

- Proven source defect: Actions run ID assigned as merge-group PR number, with invalid PR lookup and stale single-PR manifest fallback risk.
- Remediation: SHA parity, null PR identity, explicit event authority and fail-closed aggregate metadata.
- Prevention: existing Brain regression and unchanged Required/CodeQL admission, provider-controlled merge and production readback.
- No additional queue, consumer, scheduler, brain, failure registry or security bypass.
- Deployment state: CANDIDATE; group admission still blocked pending independently verifiable provider lineage and organization migration.
