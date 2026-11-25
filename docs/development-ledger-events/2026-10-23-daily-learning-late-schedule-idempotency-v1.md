# Append-only incident evidence — late GitHub scheduled event after manual learning

Date: 2026-10-23
Existing canonical owner: [#4367](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4367)
Existing daily recovery: [#4748](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4748)
Fingerprint: `learning|daily-self-evolution|missing-provider-scheduled-run|20261023-v1`

## Real causal counterexample to a two-hour trigger grace
- Existing GitHub daily workflow cron: 04:47 UTC.
- Earlier manual run `39932498219` event `workflow_dispatch`, created **09:31:34 UTC**, `improve=success`, `model-freshness=failure`.
- Later original scheduled run `39932748334` event `schedule`, created **09:33:37 UTC**, **4h46m** after cron, `improve=success`, `model-freshness=failure`.
- Thus an early fallback could execute its learner before the late original scheduled run arrives. Provider double reads before dispatch cannot predict a future delayed schedule; they protect only against a run that has already materialized. Existing daily liveness check alone cannot prove once-per-day learning.

## Minimal second-stage remediation
Same original `.github/workflows/powerhouse-daily-self-evolution.yml`: one shared `daily-admission` job performs fail-closed provider run-history attestation on `main` (date, current ID, event, branch, full provider page), before BOTH already-independent `improve` and `model-freshness` jobs. A previous same-day run of any outcome suppresses the later execution with explicit red admission. GitHub workflow-level concurrency is still the existing group but changed to `cancel-in-progress:false`, ensuring the earlier run completes before a queued late trigger's admission.

No second schedule, new agent or queue, token grant, Supabase database change, secrets, model/catalog safety downgrade, Required/CodeQL skip or synthetic model data. This is a workflow-only mutual-exclusion gate; an unavoidable duplicate GitHub **run event** is still recorded as such, not mislabeled as a second successful daily learning execution.

## Required proof and limits
- Unit replay with both exact October 23 run IDs, event types and creation order in `tests/brain-daily-learning-run-admission-v1.test.mjs`.
- Existing canonical learning evaluation modes call both the original missing-run and new duplicate-admission regressions.
- Exact-head Required/CodeQL and protected merge, main file/projection readback.
- At least one future real provider run with admitted `daily-admission=success`, followed by `improve` result and independent `model-freshness` result. No model upgrade asserted while supplier `verified_at=2026-09-30` and audit reports `REFRESH_REQUIRED`.
- Admission cannot retroactively prevent previous duplicate runs or guarantee GitHub itself will not create two run records. It prevents expensive or misleading repeated **work** after a prior run, when GitHub provider evidence is complete.
