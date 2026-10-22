# Development ledger: same-date stale blog lineage recovery (2026-10-10)

- Parent: #4198.
- Current artifact: Wet DBA, Oct 10.
- Existing GENERATED obligation and PR #4300: expired CPNL slug despite old deadline passed.
- Root cause: row helper prefers existing slug and workflow short-circuits when a same-date PR exists.
- Remediation: current-artifact export, provider-fenced GENERATED-only remap, refresh existing protected PR branch.
- Regression: tests/brain-blog-stale-lineage-p0-4198.test.mjs.
- Outcomes remain unproven until protected CI, Netlify and public production readback.
