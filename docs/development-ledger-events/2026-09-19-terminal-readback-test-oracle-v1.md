# Terminal readback test oracle v1

- Date: 2026-09-19
- Obligation-ID: terminal-readback-test-oracle-v1
- Incident: BRAIN run 35436523721 failed in backend job 105880079841 after #2331.
- Root cause: stale exact-enum test oracle still expected only two readback modes.
- Change: update the regression contract to include `github_main` and assert its strict fail-closed invariants.
- Product code: unchanged.
