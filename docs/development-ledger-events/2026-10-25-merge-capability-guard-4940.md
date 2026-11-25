# Delivery ledger event — 2026-10-25

- Obligation: `github-merge-capability-guard-20261025`
- Candidate: PR #4940, supersedes #4938
- Incident: GitHub 422 `Invalid rule 'merge_queue'` on personal User-owned repository
- Change: agent skill, deterministic guard, regression test, canonical lane classification and this auditable evidence bundle
- Result at submission: proposed implementation only, not production-proven
- Outstanding: wire into actual ruleset writer, run all exact-head gates, protected merge, provider production deploy and independent readback
- Safety: no merge_queue feature forcing, no CI bypass, no artificial green status
