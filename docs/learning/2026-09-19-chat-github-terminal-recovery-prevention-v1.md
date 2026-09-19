# Chat → GitHub terminal recovery learning v1

Fingerprint: `github|chat-terminal-recovery|exact-head-observability|v1`

## Incident
During the #2339 recovery lineage, four infrastructure defects were proven: a pipefail/SIGPIPE false failure, YAML parse fragility in a workflow `if`, missing exact-main SHA equality in `github_main` terminal evidence, and loss of HTTP 422 diagnostic bodies during terminal writeback.

## Permanent prevention
- With `set -o pipefail`, do not combine a producer pipe with a consumer that intentionally `break`s; use process substitution or another bounded non-SIGPIPE pattern.
- Quote complete GitHub Actions expressions when YAML-significant text appears inside them, and treat jobless workflow failures as parse/syntax incidents first.
- `github_main` proof requires `production_observed_sha === main_sha`.
- Terminal HTTP failures must preserve status + sanitized response body before fail-closed exit.
- Required is authoritative only after exact-head BRAIN and Powerhouse CodeQL terminal success.
- Chats/agents own the lineage through protected merge, production readback, learning/prevention writeback, skill projection readback and writer-lease release.
- Policy/skill regression tests assert semantic invariants and required concepts, not incidental prose word order.

## Proven source
PR #2339 reached `LIVE_BEWEZEN` on main `b13bfd77c57769a90c6a0701482f6d0f686f2a4b`, production-readback run `35437611144`, skill-projection run `35437611196`.
- Same-lineage reconciliation must be atomic: never make an open PR branch transiently equal to `main`; build current-main-union + candidate delta into one tree/commit before moving the ref.
- Tree-based reconciliation is fail-closed unless `base_tree_sha` is the verified tree of the exact current-main parent. Validate changed-file/deletion scope before ref movement; a partial root tree must never reach merge authority.
