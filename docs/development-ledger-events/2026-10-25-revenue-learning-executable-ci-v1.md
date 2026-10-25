# Revenue learning regression gate recovery

- Date: 2026-10-25
- Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Related source: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4851
- Fingerprint: ci|revenue-learning|new-evidence-regression-unwired|20261025-v1
- Affected owner: existing Revenue Learning CI workflow (not a production schedule)
- Required assurance: tests/brain-revenue-learning-fair-verified-20261025.test.mjs now explicitly runs premerge
- Negative replay: inferred metrics and missing source cannot promote a revenue winner
- Positive replay: verified source-backed cohorts remain evaluable within bounded cross-channel fairness
- Status: CANDIDATE_PENDING_EXACT_HEAD_CI; no fake runtime receipts.
