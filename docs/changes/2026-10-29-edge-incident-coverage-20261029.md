# Edge function coverage of the incident register and self-fix duty

The incident duty (register every error, fix it yourself, owner keeps irreversible decisions) was enforced for skills only. This change extends the same existing preflight check to the 59 edge functions in `supabase/functions/*/index.ts`.

A function that carries the comment marker `INCIDENT_PROTOCOL: agents-skills-register-and-self-fix-v1` counts as covered. A function listed in `edge_function_protocol.loop_debt_baseline` without the marker is visible loop debt in `incident_self_fix.edge_functions`. Any other function without the marker fails the preflight. All 59 existing functions are the baseline today; none carries the marker yet, so the first measurement is 0 of 59. The baseline shrinks by removal when a function is next changed.

Limits: the marker is a declaration, not proof that errors are written to the existing `powerhouse_runtime_events` route. Behaviour is proven per function by its own test. Make scenarios have no file in the repository and stay policy only. No new register, store, scheduler or provider call.

Validation: four new tests in `tests/brain-incident-register-self-fix-preflight-20261029.test.mjs`. Protected merge and a main readback remain mandatory before this counts as live. Rollback is a protected revert.
