# Powerhouse Engineering OS — Closed Loop v1

Fingerprint: `powerhouse-engineering-closed-loop-v1`

This is not a new engineering authority. It is an executable continuous-improvement capability inside `powerhouse-engineering-os-v1` and remains subordinate to the Engineering Constitution and `BRAIN-DELIVERY-v2`.

## Goal

Shorten Idea/Fix → LIVE & BEWEZEN without trading away correctness, security, recoverability, maintainability or evidence quality.

## Six required capabilities

1. **Engineering scorecard** — compute DORA throughput/instability signals plus Powerhouse `idea_to_live_bewezen_ms`, test flake rate, escaped defects, gate latency and evidence completeness. Missing evidence is `unknown`, never synthetic zero.
2. **Flaky-test intelligence** — classify pass/fail oscillation for the same test/check and source revision; quarantine is diagnostic only and may never turn a required failure green.
3. **Capability/dependency graph** — machine-readable nodes/edges and reverse blast-radius traversal across code, tests, workflows, runtime/provider and human knowledge projections.
4. **Recovery proof** — validate dated evidence for code rollback, Netlify atomic rollback/readback, database backup/PITR or equivalent restore path, migration recovery/forward-fix and provider fallback. A plan without a successful bounded rehearsal is not proof.
5. **Golden-path generators** — deterministic scaffolds for `frontend`, `backend`, `migration`, `agent`, and `integration`; generated paths stay inside existing registered delivery lanes and include contract/test/observability/doc hooks.
6. **Meta-learning** — evaluate gate effectiveness, escaped defects, flake rate and latency; suggest evidence-backed Engineering OS changes, but never self-weaken a gate or autonomously change production authority.

## Safety and authority

- EXISTING-STATE-FIRST / REUSE-FIRST / CANONICAL-INTEGRATION / CLOSED-LOOP.
- GitHub remains source/review/protected-delivery authority.
- Netlify remains immutable web deploy/readback authority; atomic deploy rollback is recovery evidence, not source authority.
- Supabase remains runtime/data/learning authority; backups/PITR evidence is recovery evidence, not a substitute for source-controlled migrations.
- Notion remains human-readable knowledge/audit projection.
- Buffer/providers remain execution/readback evidence only.
- No new brain, queue, registry, analytics store or learning store.

## Evidence model

Every metric or recommendation includes `value`, `status` (`measured|partial|unknown`), provenance and observation window where applicable. Scorecards must expose `evidence_completeness`.

## Recovery freshness

Default maximum age for recovery rehearsal evidence: 90 days. A failed, stale or missing required recovery domain blocks `recovery_proven=true`.

## Meta-learning promotion rule

A meta-learning suggestion may become an Engineering OS change only via normal branch → test → preview/verify → protected promotion → production/readback → writeback. It may not directly modify required checks, security controls, production configuration or recovery settings.

## External evidence incorporated

- DORA current software-delivery metrics: change lead time, deployment frequency, failed deployment recovery time, change fail rate and deployment rework rate.
- Netlify Deploy Previews and immutable deploy permalinks/atomic rollback for candidate and recovery evidence.
- Supabase backup/PITR guidance for database recovery evidence.

## Definition of Done

The capability is complete only when contract + pure functions + CLI + regression tests + Required-test wiring + scheduled evidence workflow are on protected `main`; exact candidate checks are green; canonical Supabase CurrentState/Learning and existing Notion authorities are written and read back; open release obligation is null.