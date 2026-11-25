# 2026-11-03 original BRAIN archive evidence fixture drift

- **Native source run:** 41599748028, backend job 125795703107, failed test #465, one failure in full BRAIN. Terminal run 41599675594 was blocked by that BRAIN conclusion.
- **Root cause:** old test expected optional `if-no-files-found: warn`, despite protected real Janitor archive workflow requiring `if-no-files-found: error` and an always-running Brain incident observer.
- **Change:** test assertion aligned with stricter workflow and independently checks observer. No production permission, branch deletion, token or check bypass.
- **Owner/fingerprint:** `github|brain-janitor|archive-artifact-warning-fixture-stale-after-failclosed|20261103-v1`.
- **Prevention:** every tightening of incident artifact/reporting policy must update historical regression; missing native readback still causes failed job. Preserve existing exclusive owner.
- **Status:** PATCH_CANDIDATE_NOT_LIVE until exact-head CI + CodeQL + full BRAIN, protected merge and readback. The actual GitHub tag-write 403 and rate limits remain separately unresolved.
