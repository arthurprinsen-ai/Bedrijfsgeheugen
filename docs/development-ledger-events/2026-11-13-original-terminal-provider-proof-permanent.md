# Incident: merged migration without independently proven live terminal guard

Observed 2026-11-13. Original P0 owner: #4198; original release PR: #5724. On protected main, migration 083000 exists and PR #5724 merged. Original production provider still had 842 applied SQL identities, last 082500. Original trigger `brain_content_handoff_terminal_proof_guard_v1` not installed. Existing cron #171 was active and last run succeeded, but only 9/15 loop assurances GREEN and 365 original content handoffs OPEN.

Root cause for prevention: migration terminal proof checked version but not exact source name, enabled trigger, privileges and runtime source. This event does not infer that source release caused the 365 existing open obligations.

Corrective candidate: retain EXACT original `obligation-terminal-closure.yml` flow and add exact provider version/name and enabled invoker guard check to the called `tools/delivery/supabase-migration-production-readback.mjs`. Negative historical replay in `tests/brain-supabase-migration-production-readback-v1.test.mjs`. Skill: `.agents/skills/release-deployment-readback/SKILL.md`. No new scheduler, direct production DDL or external provider action.

Required evidence: exact-head Required/CodeQL, protected merge, original provider applied migration 083000 + enabled guard production readback, source lock 843 only if actually provider applied, original #171/ONE BRAIN original source and consumer ACK and independently measured downstream results. This record does not assert currently live or full-green.
