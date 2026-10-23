# Supervisor executed-run proof — development ledger (2026-10-23)

- Canonical issue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4661
- Fingerprint: `delivery|supervisor|unverified-run-drift-and-cas-classification|20261023-v1`
- Immutable provider baseline: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39960974891
- Root: actual supervisor drift and terminal writer-lease denials were not counted by run/PR in the existing hourly telemetry; CAS status could be overclaimed without typed evidence
- Repair: existing hourly Repository Janitor receives one bounded read-only provider run/job/log observer, without new scheduler, API mutation or merge authority
- Verification: `tests/brain-supervisor-run-evidence-v1.test.mjs`, exact-head Required/CodeQL, protected main and a subsequent actual Janitor artifact
- Safety: no false schedule count for workflow_dispatch, no repeat inflation within a run, no status forgery, no weakening of security, no new failure registry
- Open: #4772/#4778 writer-owner lease transitions, actual schedule liveness, matched before/after CI/release measurements, independent Netlify portal production readback
- Status: CANDIDATE until provider CI, protected merge and Janitor runtime readback independently succeed
