# Founder LinkedIn prepublish bridge — P0 #4198

The existing Powerhouse content orchestrator and social publisher recognize verified founder-journey events, but the final prepublish gate still required personal-life-only topics. The correction reuses the existing builder policy and the same Brain evidence without creating a new Heartbeat, Brain, queue or scheduler.

Only an event with verified build, Arthur anchor, source lineage and personal identity can use the founder lane. The exact post hash, privacy rules, company identity separation, no-sales requirement and live provider verification stay mandatory. A text mentioning Bedrijfsgeheugen is not evidence by itself.

Observed on 2026-10-09: 32/32 runtime layers wired but Loop Assurance 7 GREEN, 2 AMBER, 6 RED and commercial daily run degraded. Neither this candidate nor a green build proves a sent LinkedIn post or the full closed loop.

Release: protected CI, positive and negative regressions, protected merge, Supabase Edge exact-code readback and evidence-based provider outcome. Related PR #4264.
