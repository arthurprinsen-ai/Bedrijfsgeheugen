# BRAIN CodeQL source contracts align to the active workflow

- Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/3742
- Original failing BRAIN evidence: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39755490943/job/119746782219
- Fingerprint: `powerhouse|brain|codeql-current-mergegroup-authority-oracle|20261022-v1`
- The old `.github/workflows/powerhouse-codeql.yml` is deliberately retired. Current canonical `.github/workflows/codeql.yml` (blob `96459966b2edda60159ce288e9c3411c5fbce82c`) is the actual Powerhouse CodeQL required-check owner.
- Update only two historic BRAIN test-source file references. Replace one obsolete conditional scope-filter assertion with explicit active coverage: pull requests, protected merge groups, JS and Python, extended security queries, SARIF audit artifacts, cancel-in-progress ref single-flight. Update the existing Rocket Delivery concurrency string to current merge-group-aware authority.
- Add `tests/brain-codeql-current-workflow-oracle-20261022.test.mjs` as a fail-closed regression against removed CodeQL workflow reintroduction and future security control weakening.
- No workflow edits, CI gate skips, security permission change, schema, user data, provider, scheduler, or production mutation.
- Exact-head Required and CodeQL plus FULL BRAIN **zero failure** still required before merge; retain independent migration parity #3742 and authenticated tenant acceptance #4215.
