# Append-only development event — 2026-10-22

Obligation-ID: ci-brain-netlify-build-entry-oracle-20261022
Fingerprint: brain|netlify-build-entry|stale-inline-toml-oracles|20261022
Parent: GitHub #3742.
Baseline: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39671036043 (321 / 3,511 failed).
Cause: legacy Netlify inline build assertions survived the canonical build entrypoint refactor.
Action: six affected tests + one fail-closed canonical source helper; retain required assertions; Brain learning, product-led skill and human change log.
Prevention: TEST_ACTUAL_CANONICAL_BUILD_ENTRY_NOT_RETIRED_INLINE_COMMAND.
Status: CANDIDATE_UNVERIFIED. Production unchanged. Exact-head targeted tests, full BRAIN, Required and CodeQL not yet demonstrated.
