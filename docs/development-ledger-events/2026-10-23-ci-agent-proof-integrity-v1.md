# Powerhouse CI agent proof hardening — 23 October 2026

Owner issue #4661; fingerprint `delivery|ci-agent-priorities|immutable-thresholds-and-sha-integrity|20261023-v1`; existing protected primary matrix correction #4809 merged to main `2fa83c9d5e2a62f441a77bc3a6a3af15eba2c03d` with exact-head Required and CodeQL success.

Canonical overlapping source #4808 closed unmerged rather than risking a duplicate voter implementation. Its two not-yet-merged protections were isolated: invalid `run_id:run_attempt` SHA ambiguity and caller-tunable weaker advisory thresholds. The single same existing `ci-agent-priorities.mjs` now rejects mixed-SHA attempts and clamps minimum-independent-attempt (3), minimum median runtime (60s), max priorities (5). No new CI scheduler, PR-head mutator, provider calls or parallel incident log. Regression tests include tampered matrix sibling, weak thresholds, strict thresholds and bounded priority output.

Closure remains held pending actual immutable protected Required + CodeQL, main source + skill projection and independent future Janitor runtime. The numerical CI-speedup hypothesis is unproven and customer/outcome acceptance separate.
