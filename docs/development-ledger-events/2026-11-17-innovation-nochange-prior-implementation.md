# 17 November — original innovation no-change overrides source audit incorrectly

- Original incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Original owner: agent:agent-integration-engineer. Candidate: 55bb0754-355b-4940-aaea-aed7123e7e57. Existing immutable Brain operation: edebcb32-335b-49f0-b527-eb4289f95c5c.
- Original protected historical implementation: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5857 and follow-ups #5866/#5879. Safe historical parent selection: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5981.
- Exact negative original Brain readback: `original_code_nochange_review.observed_at=2026-11-17T20:30:48.717Z`; original live source continuity at `2026-11-17T20:40:34.341Z` still showed `NO_CHANGE_INDEPENDENT_OWNER_REVIEW_DUE` and no current source measurement. The protected PR #5983 had already been merged; this is not merely an unmerged candidate.
- Cause: a single `!noop` gate unintentionally shadowed earlier protected implementation source, even though no-change in a later Codex run does not undo historical code. Evolving system must persist both receipts without replacing/reinterpreting either.
- Fix: after authenticating same original source, remove only the redundant nochange veto for historical provider readback; do not weaken upstream source identity, old PR dedupe, terminal gate or effect/consent gate.
- Historical replay/canary regression: tests/brain-innovation-existing-protected-source-reconcile-20261117.test.mjs. Protected release and provider proof still required before any live claim.
- No new independent consumer ACK or revenue/impact claimed; original 14 innovation obligations remain OPEN until actual production effect and Heartbeat learning are verified.
