# Canonical development ledger — independent Recovery Supervisor drift telemetry — 2026-10-23

- Fingerprint: `github|recovery-supervisor|drift-evidence-not-measured-across-runs|20261023-v1`.
- Parent issue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4120
- Previous protected prerequisite: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4781
- Real historical event: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39960974891 (49 main-drift classifications, 58 no-lease messages; no complete PR recovery inferred).
- Implementation: existing hourly Repository Janitor reads at most two completed Supervisor runs + logs; emits single artifact, bounded read-only requests, no new scheduling or mutation.
- Regression: `tests/brain-recovery-supervisor-observed-telemetry.test.mjs`.
- Required proof: exact SHA Required+CodeQL, protected squash, hourly Janitor artifact readback and provider run IDs.
- Status: CANDIDATE_PENDING_PROTECTED_CI_AND_OBSERVED_ARTIFACT; no speedup or portal live claim.
