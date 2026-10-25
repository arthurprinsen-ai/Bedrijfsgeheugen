# 2026-10-24 — independently verified company post analytics source handoff

- Canonical owner: existing six-hour `bg-social-metrics-sync` with existing Powerhouse Social/Brain and existing publication obligations; not a new publisher or scheduler.
- Root cause: provider metrics exist in Windsor daily growth source with quality PROVIDER_OBSERVED_UNLINKED, while canonical publisher has independent LIVE_PROVEN author_urn matching Windsor org account and exact published URNs. These were not reconciled to post-metric snapshots, so the daily learning had no denominator.
- Safe repair: exact owner+URN+provider author proof gated, bounded source read, idempotent provider event, no inferred sales and no unverified missing views promoted as zero.
- Rollback: retain source staging and canonical post index; detach only new proof-bound idempotent snapshot write (no destructive schema edits).
- Tests: tests/brain-linkedin-company-windsor-proof-link-v1.test.mjs. Required+CodeQL, protected deployment, then exact company post readback and future 24/48/72h evaluation.
