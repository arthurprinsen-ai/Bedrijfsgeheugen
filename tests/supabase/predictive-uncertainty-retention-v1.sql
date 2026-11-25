-- Pure-function provider regression: no table writes or synthetic customer records.
with cases(name,previous_payload,canonical_payload,previous_due,canonical_due,previous_status,want_attempt,want_due,want_status) as (
 values
 ('same_revision_retains_uncertainty','{"forecast_revision":"a","last_result":"uncertain","last_attempt_at":"2026-10-19T20:00:00Z","provenance":"kept"}'::jsonb,'{"forecast_revision":"a","probability":0.7}'::jsonb,'2026-10-26T00:00:00Z'::timestamptz,'2026-10-19T00:00:00Z'::timestamptz,'OPEN',true,'2026-10-26T00:00:00Z'::timestamptz,'OPEN'),
 ('changed_revision_clears_old_attempt','{"forecast_revision":"a","last_result":"uncertain","last_attempt_at":"2026-10-19T20:00:00Z"}'::jsonb,'{"forecast_revision":"b"}'::jsonb,'2026-10-26T00:00:00Z'::timestamptz,'2026-10-20T00:00:00Z'::timestamptz,'OPEN',false,'2026-10-20T00:00:00Z'::timestamptz,'OPEN'),
 ('closed_evidence_is_immutable','{"forecast_revision":"a","outcome":"materialized"}'::jsonb,'{"forecast_revision":"b"}'::jsonb,'2026-10-18T00:00:00Z'::timestamptz,'2026-10-20T00:00:00Z'::timestamptz,'CLOSED',false,'2026-10-18T00:00:00Z'::timestamptz,'CLOSED'),
 ('new_obligation_uses_canonical_due','{}'::jsonb,'{"forecast_revision":"a"}'::jsonb,null::timestamptz,'2026-10-20T00:00:00Z'::timestamptz,'OPEN',false,'2026-10-20T00:00:00Z'::timestamptz,'OPEN'),
 ('unbound_old_attempt_is_not_reused','{"last_result":"uncertain","last_attempt_at":"2026-10-19T20:00:00Z"}'::jsonb,'{"forecast_revision":"a"}'::jsonb,'2026-10-26T00:00:00Z'::timestamptz,'2026-10-20T00:00:00Z'::timestamptz,'OPEN',false,'2026-10-20T00:00:00Z'::timestamptz,'OPEN'),
 ('earlier_backoff_never_advances_canonical_deadline','{"forecast_revision":"a","last_result":"uncertain","last_attempt_at":"2026-10-19T20:00:00Z"}'::jsonb,'{"forecast_revision":"a"}'::jsonb,'2026-10-20T00:00:00Z'::timestamptz,'2026-10-26T00:00:00Z'::timestamptz,'OPEN',true,'2026-10-26T00:00:00Z'::timestamptz,'OPEN')
)
select c.name,(m.payload?'last_attempt_at')=c.want_attempt
 and m.due_at is not distinct from c.want_due and m.status=c.want_status
 and (c.previous_status<>'CLOSED' or m.payload=c.previous_payload)
 and (c.name not in ('changed_revision_clears_old_attempt','unbound_old_attempt_is_not_reused') or m.payload->'forecast_calibration_prior_attempts_v1'->0->>'last_result'='uncertain')
 and (c.name<>'same_revision_retains_uncertainty' or m.payload->>'provenance'='kept') as passed
from cases c cross join lateral public.powerhouse_merge_calibration_obligation_v1(c.previous_payload,c.canonical_payload,c.previous_due,c.canonical_due,c.previous_status) m;
