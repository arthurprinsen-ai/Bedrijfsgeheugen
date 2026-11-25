# ONE BRAIN experiment-policy promotion: no silent errors (3 November 2026)

Original source owner: ONE BRAIN policy promotion; execution owner: existing runtime mux job #171. Parent issue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198 .

**Observed source defect.** Current production public.powerhouse_one_brain_reconcile_v1 loops over experiment policy promotion, but on any exception runs `EXCEPTION WHEN OTHERS THEN NULL`. The existing public.powerhouse_runtime_mux_task_v1 executes the SQL but discards its JSON result and reports ok=true unless SQL raises. This can suppress real policy faults, while the scheduler looks healthy.

**Contained source correction.** Keep the same functions, cron and scheduler. In the original policy loop capture only SQLSTATE and SHA-256 of policy key, record a unique real failure occurrence in public.brain_failure_registry via brain_observe_failure and continue independent policies. Return failure count in the original JSON. Change only the original mux helper's named `one-brain-reconcile` handling to read that JSON and mark ok=false when promotion failures exist or receipt is absent; all unrelated tasks retain their existing behavior. Original ONE BRAIN / Heartbeat receives task_results with real failures. No new credential, provider, queue, schedule, data egress, recipient or public grant.

**Failure modes.** If Brain failure registration fails, the existing mux must catch the thrown error and report ERROR instead of green. No raw SQL exception, policy name, tenant content or credentials are placed in the receipt. Historical triage-only recovery records do not become fixed through this change. No claims of successful original production migration yet.

**Acceptance:** targeted negative/positive Node regression → exact-head Required/BRAIN/CodeQL + Supabase Preview → protected merge → production pg_get_functiondef matches approved source → actual scheduled :13/:43 event with readable task_results; inject only isolated synthetic failure in approved nonproduction rehearsal, and verify existing failure registry count/owner plus no unrelated task drift. Existing incident status remains OPEN until that evidence.
