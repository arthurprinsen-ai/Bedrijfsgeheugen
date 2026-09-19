# Development ledger — chat GitHub terminal recovery prevention v1

- Date: 2026-09-19
- Fingerprint: `github|chat-terminal-recovery|exact-head-observability|v1`
- Source lineage: PR #2339
- Proven main: `b13bfd77c57769a90c6a0701482f6d0f686f2a4b`
- Production readback: GitHub Actions run `35437611144`
- Skill projection: GitHub Actions run `35437611196`
- Material learnings: pipefail/SIGPIPE-safe shell recovery; YAML expression safety; exact `github_main` SHA identity; HTTP error-body observability; exact-head sibling-gate aggregation.
- Prevention ownership: all chats, agents, skills and delivery workflows.
- Status: source incident terminally proven; this follow-up candidate makes the learning explicitly durable across agent/skill surfaces.
- Additional recovery learning: a missing Git `base_tree_sha` created a partial candidate tree with repository-wide deletions; PR was immediately drafted before merge, main remained untouched, and prevention now requires verified current-main tree identity plus diff-size guardrails.
