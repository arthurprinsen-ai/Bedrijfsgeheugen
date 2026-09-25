# Live proof: current main ↔ provider production

Date: 2026-09-25

Powerhouse terminal delivery now requires a fresh binding between repository truth and provider truth before reporting `LIVE_BEWEZEN`.

The agent must read the current `main` SHA and the current production provider commit at claim time. Exact SHA equality is sufficient. If production has advanced beyond the delivered merge, Git ancestry must prove that the delivered lineage is contained in that production commit. If `main` is ahead of production, the newest main state is not yet live.

This prevents stale deploy evidence, merge-only claims and ambiguous “live” status after concurrent repository movement.

Canonical fingerprint: `delivery|live-proof|current-main-provider-descendant|v1`.
