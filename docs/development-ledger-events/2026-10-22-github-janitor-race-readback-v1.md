# Development ledger — 2026-10-22 GitHub janitor recovery

- Event: `REPOSITORY_CLEANUP_PREVENTION_CANDIDATE`
- Obligation: `github|repository-cleanup-race-readback|20261022-v1`
- Fingerprint: `github-repository-hygiene:deleted-branch-404-and-retired-lease-readback-v1`
- Baseline main: `f627153ed569820917a2dc5787dd210613f0395e`
- Evidence: Repository Hygiene run 39755226803, compare 404 on writer/paginacontrole/6ad2489cf3400128; Janitor run 39761281487, false-red readback #3995 after AUTO_REOPEN_TERMINAL_LEASE.
- Source: scripts/brain/repository-hygiene.mjs and .github/workflows/powerhouse-repository-janitor.yml
- Test: tests/brain-repository-hygiene.test.mjs; includes deleted-ref 404 fail-closed and retired lease readback guard.
- Retired branches/PRs are preserved until proven safe cleanup; unrelated orphan run incident #4655 unresolved.
- Outcome: CANDIDATE; protected tests and live readback outstanding.
