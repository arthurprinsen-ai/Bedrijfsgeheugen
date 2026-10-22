# Append-only BRAIN CodeQL source-contract repair — 2026-10-22

- Fingerprint: `powerhouse|brain|codeql-current-mergegroup-authority-oracle|20261022-v1`
- Evidence: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39755490943/job/119746782219
- Two historic tests referenced a deleted workflow path, while active CodeQL authority moved to `.github/workflows/codeql.yml` (blob `96459966b2edda60159ce288e9c3411c5fbce82c`).
- Repoint only tests; preserve or strengthen security assertions to current merge_group and matrix semantics. Regression: `tests/brain-codeql-current-workflow-oracle-20261022.test.mjs`.
- Strictly no CI workflow modification, disabling, CodeQL suppression or production change.
- No claims of full BRAIN green. Independent #3742 and #4215 remain open.
