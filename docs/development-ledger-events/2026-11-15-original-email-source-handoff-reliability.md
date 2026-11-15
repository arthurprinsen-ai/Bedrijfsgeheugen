# Engineering ledger — four original email workstreams (2026-11-15)

- Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Obligation-ID: powerhouse|email|four-workstream-source-handoff-safe-send-measurement|20261115-v1
- Original owner: original-agent:commercial; #116 research, #138 identity, original composer/outreach and existing ONE BRAIN/Heartbeat.
- Observed: 23,295 graph contacts, 605 known emails; ten source retries and four broken/unproven 7d handoffs; composer source/news records separately diagnosed; no new provider-send authorized.
- Root-cause 1: all HTML exceeding 160,000 bytes rejected, even if a bounded named/public mailto could be inspected. Change: hard-limit in-memory read to 160,000 bytes and explicitly treat no-email truncated page as incomplete for the same original due-only retry.
- Root-cause 2: original composer only examines fixed top 50 waiting actions. Change: four deterministic capped pages of 50 and exact original independent news-source verification. No expired action reopened or address promoted.
- Consent, suppression, sender-deduplication, provider readback and measured outcomes continue under original authority; all unproven stages remain OPEN. No new account, scheduler, worker, sender, paid vendor or fabricated record.
- Code: supabase/functions/powerhouse-relationship-public-research/index.ts; supabase/functions/powerhouse-commercial-message-composer/index.ts.
- Regression: tests/brain-original-email-research-handoff-20261115.test.mjs.
- Skill: .agents/skills/powerhouse-daily-full-connection-enrichment/SKILL.md.
- Learning: brain/learning/2026-11-15-original-email-source-handoff-reliability-v1.json.
- Human documentation: docs/changes/2026-11-15-original-email-source-handoff-reliability.md.
- Release stage: CANDIDATE / NOT GREEN / NOT LIVE. Protected Required, CodeQL, Supabase provider parity and natural original consumer/outcome readback not yet proven by this ledger.
- Recovery if checks fail: preserve exact source/action keys and evidence, diagnose failure, fix this same branch/lineage through protected CI. Never bypass controls or silently report fulfilled.

- Protected delivery recovery: predecessor #5909 passed Required+CodeQL but was closed UNMERGED after current main advanced one independent commit and protected GitHub merge returned HTTP 405 `3 of 3 required status checks are expected`; candidate #5911 reuses the same nine files on new immutable main `60c41d4813f3bc0d3a3ef9fcdca095597221a0da` without changing any unrelated files.
- Candidate metadata failure (run 43756970098): `PR_MACHINE_METADATA_INVALID:SUPERSEDES_INVALID`. Cause: freeform `Supersedes: #5909 (...)` where the canonical parser requires exact numeric predecessor. Fix: PR #5911 body now has precisely `Supersedes: 5909`; rerun admission on new exact-head commit. Prevention: use machine-only exact numeric metadata values; keep human explanation in prose, not the parsed header.

- P0 sender root cause: original Gmail execution acquired `prepared→waiting` without atomically persisting a pre-send uncertainty fence, allowing a crash gap before acknowledgement checkpoint and risking a duplicate after an unrelated watchdog requeued the action. Recovery: single CAS update with original action ID, updated_at, status, and `needs_readback=true/republish_forbidden=true` *before* provider call, no blind resend, exact provider GET or OPEN.
- P0 recipient root cause: the original sender could use first ACTIVE account if the configured Gmail identity was missing; now fail-closed on pinned mismatch. It also rechecks 14-day confirmed historical sends and pending uncertainty for the same person.
- P0 outcome root cause: repeated settlement previously upserted historical send `occurred_at=now`, and subsequent old readbacks were counted as fresh sends. Fix: ignoreDuplicates + exact original outcome readback and preserve original attempt timestamp, separate `attempted_now/verified_new_sends/prior_readbacks_settled`. Independent provider time remains UNKNOWN.
- Regression: `tests/brain-original-email-atomic-send-and-outcome-20261115.test.mjs` and `tests/brain-original-ambiguous-gmail-no-resend-20261110.test.mjs`; protected checks, exact live Edge parity, #116/#138 source/outcome/proven learning still required. NO commercial closure from this candidate.
