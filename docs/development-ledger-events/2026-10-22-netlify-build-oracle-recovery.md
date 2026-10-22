# Append-only development event — 2026-10-22

Obligation-ID: ci-brain-netlify-build-entry-oracle-20261022
Fingerprint: brain|netlify-build-entry|stale-inline-toml-oracles|20261022
Parent: GitHub #3742.
Baseline: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39671036043 (321 / 3,511 failed).
Cause: legacy Netlify inline build assertions survived the canonical build entrypoint refactor.
Action: six affected tests + one fail-closed canonical source helper at tests/brain-netlify-canonical-build-source.mjs; retain required assertions; Brain learning, canonical Netlify production-truth skill and human change log.
CI admission initial failure: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39763346154 — unclassified tests/helpers path. Root fix: move test helper under existing backend-classified tests/brain-* without weakening classifier, replace all six references; revert noncanonical skills/ path, use existing classified .agents/skills skill.
Prevention: TEST_ACTUAL_CANONICAL_BUILD_ENTRY_NOT_RETIRED_INLINE_COMMAND.
Status: CANDIDATE_UNVERIFIED. Production unchanged. Exact-head targeted tests, full BRAIN, Required and CodeQL not yet demonstrated.

## Same-root second mini-batch after full BRAIN evidence
- Source: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39764656116 (3,521 tests, 3,169 pass, 352 fail).
- Additional matching historical oracles: tests/brain-search-indexing-sitemap-contract.test.mjs (SEO pipeline source) and tests/brain-website-coherence-v1.test.mjs (final coherence source).
- Both now resolve authoritative ordered build phases through tests/brain-netlify-canonical-build-source.mjs. No production or CI policy modifications.
- Learning evaluation grows from six to eight suites; exact-head replay, Required, CodeQL and new whole BRAIN are pending. Initial 352 failures remain unclosed until executed acceptance.
