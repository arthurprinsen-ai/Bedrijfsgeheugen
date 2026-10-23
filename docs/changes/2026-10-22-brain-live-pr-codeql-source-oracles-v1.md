# 22 October 2026 — live PR lease & CodeQL source oracle recovery

- Parent P0: [#3742](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/3742); independent baseline [BRAIN 39791707071](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39791707071) = 3,526 cases, 3,171 passed, 355 failed.
- Distinct fingerprint: `ci|brain|live-pr-codeql-retired-source-oracles|20261022-v1`; owner: `ci-brain-live-pr-codeql-oracle-20261022`.
- Failures 801 and 1956 are *inherited test source drift*, not a verified failure of the live lease check or CodeQL. Do not subtract these from 355 absent a new exact-head run.
- Preserve live PR fetch, SHA comparison, mutable synchronized PR body re-read, lease parse and fail-closed terminal lease; preserve single canonical .github/workflows/codeql.yml, merge_group / PR / ref stable concurrency, cancel-in-progress and both language scans.
- Retired .github/workflows/powerhouse-codeql.yml must not be recreated. No workflow, runtime, provider, tenant, SQL, scheduler, deployment or security gate modified.
- Same two existing tests are required for historical replay, shadow and canary. Prevent recurrence by checking current canonical source before hardcoding its literal syntax.
- Candidate only until exact-head Required CI, CodeQL and full independent aggregated BRAIN zero failures on *one integrated head*, supported migration clean-room/parity #3742 and real two-tenant authenticated outcome #4215; protected merge and exact production readback remain mandatory.
