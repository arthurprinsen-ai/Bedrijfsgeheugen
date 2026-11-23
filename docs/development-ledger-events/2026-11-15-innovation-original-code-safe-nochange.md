# Original innovation failed-first-run recovery ledger — 2026-11-15

- Observed GitHub run: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/43752164113
- Canonical candidate: 7ae7a817-5900-41df-bf7c-d127e8336b13
- Original incident: zero-source-change Codex invocation treated as invalid partial source implementation despite verified existing local regression
- Detection: enforced `--validate` failed with PATH_SCOPE_OR_EVIDENCE_MISSING, no PR generated and no original source ACK
- Root cause: validator required source + new test + learning for *every* candidate even when the agent made no changes; no typed original no-change receipt or selector skip existed
- Recovery: classify **only exact empty diff** as source review due; native original CAS + provider GET in `brain_operations.evidence.original_code_nochange_review` and dedupe future source-identical reviews
- Partial/unsafe changes: remain fail-closed; never generate filler code to pass validation
- False-success prohibition: original operation PLANNED, 14 innovation obligations OPEN, no consumer ACK, no measured effect
- Regression: `tests/brain-innovation-original-code-delivery-20261115.test.mjs`
- Pending: protected release + real source-bound replay + independent native GET and measured business source review

## Protected admission regression found and fixed

- Original PR #5904 exact head `6e2497bdf9bd2f81df3cd1f9d4ac5996d7af69a9` hygiene/admission failed on the NEW historical replay guard, not on application behavior: test attempted to mutate a frozen returned no-change receipt directly (`Cannot assign to read only property 'source_sha256'`).
- Root cause: negative drift fixture did not clone an immutable source receipt before corrupting it for assertion.
- Recovery: copy with object spread, corrupt only the isolated test fixture, and re-run original Required/CodeQL; do not weaken immutable production receipts, source gates or learning requirement.
- Regression: `tests/brain-innovation-original-code-delivery-20261115.test.mjs` now tests mismatch via a copied receipt.
