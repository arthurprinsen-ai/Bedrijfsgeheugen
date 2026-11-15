# Development ledger — 2026-11-15 canonical backfill fanout repair

- Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Fingerprint: `powerhouse|one-brain|completion-backfill-duplicate-original-obligation-fanout|20261115-v1`
- Source observation: original production `brain_outcome_obligation_dispatch` AgentWork/PENDING grew during original completion-supervisor backfill, concentrated on a handful of canonical obligation IDs; original workflow was in progress. A new row is not a real processed work result.
- Root cause: `activeDispatches()` produced a distinct `coalesceKey` for every historical candidate, despite multiple candidates referring to the same immutable canonical registered obligation.
- Repair: group original active backfill triggers only by registered canonical obligation ID, stable never-per-day fingerprint; retain every candidate in original report and existing append-only source; include aggregated count+identity digest in dispatch artifact.
- Owner: existing Completion Supervisor + Reliability/Data Quality. No second scheduler, workflow, agent, sender or store.
- Skill: existing `.agents/skills/powerhouse-continuity/SKILL.md` updated. Code: `tools/outcome-obligation-completion-supervisor-backfill.mjs`.
- Regression: `tests/brain-completion-supervisor-backfill.test.mjs` replays 1201 histories for one obligation plus independent second obligation; stable idempotency, no lost candidates, no newly invented terminal output.
- Release status at authoring: CANDIDATE, **not** merged, not live and not historical consumer proof. Required/CodeQL/BRAIN, protected merge, exact production SHA and next original natural-run provider/consumer evidence still required.
- Prevention: never equate historical source candidates with separate external work commands; dedupe by original owned business obligation for *backfill only*, preserve source revision and individual original records for reconciliation.
