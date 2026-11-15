# P0 original innovation PR false-dedup incident — 2026-11-15

- Parent issue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- First failed real code execution: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/43752164113
- Previous protected no-change correction: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5904
- Post-release successful-but-empty original code run: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/43753665119
- Provider independently observed: `selected:false`, `NO_NEW_SOURCE_BOUND_SAFE_CODE_CANDIDATE`; 14 original obligations OPEN; 0 original code PR receipts and 0 no-change review receipts
- Root: `body.includes(candidate_id)` counts an *incident narrative* as an existing implementation PR
- Repair: exact, unique original implementation metadata (candidate, operation, revision, SHA, type) and real OPEN/MERGED status; CLOSED unmerged ignored
- Mandatory next: protected test+CodeQL+merge, matching Netlify commit, same-original scoped replay, native independent readback
- Safety: no new scheduler/agent, no bypass, zero fake savings, no false successful implementation, no loss of historical candidate lineage
- Regression: `tests/brain-innovation-pr-identity-20261115.test.mjs`
