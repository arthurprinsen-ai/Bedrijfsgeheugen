# LinkedIn underperformance closed loop — 2026-10-28

- Root cause: no registered/evaluated experiment path for LinkedIn underperformance; application/decision tables empty; challenger limited to company/instagram and to data that does not exist.
- Fix: DB functions bg_social_lus_cyclus/beoordelen/meting + bg_linkedin_bewijs, called from the existing powerhouse-content-orchestrator for linkedin_company and linkedin_personal; one variable per channel; results written to revenue_learnings, social_learning_decisions and social_learning_applications.
- Single owner: existing orchestrator and cron, no new scheduler, agent register or data store; CRO gates cannot see loop experiments.
- Regression: tests/brain-linkedin-underperformance-loop-20261028.test.mjs.
- Status: candidate only. Required/CodeQL, protected merge, protected migration, edge deploy parity and a genuine orchestrator readback are pending; reach/likes/comments improvement is unproven.
