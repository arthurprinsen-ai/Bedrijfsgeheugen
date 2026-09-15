-- Keep the existing content operations cockpit a one-row-per-obligation projection.
-- social_experiments can contain repeated rows for the same canonical experiment/date.

create or replace view public.content_operations_cockpit as
with experiment_one as (
  select distinct on (tenant_id, experiment_id, calendar_date)
    tenant_id,
    experiment_id,
    calendar_date,
    comparison_scope,
    recipe,
    source_signals,
    commercial_hypothesis
  from public.social_experiments
  order by tenant_id, experiment_id, calendar_date, updated_at desc nulls last, created_at desc nulls last
)
select
  o.tenant_id,
  o.publication_date,
  o.channel,
  o.content_kind,
  o.status,
  o.experiment_id,
  e.comparison_scope ->> 'family' as experiment_family,
  e.comparison_scope ->> 'mode' as decision_mode,
  e.recipe,
  e.source_signals,
  e.commercial_hypothesis,
  o.content_id,
  o.slug,
  o.external_id,
  o.canonical_url,
  o.last_error,
  o.recovery_attempts,
  o.evidence,
  o.metrics,
  o.next_action,
  d.decision,
  d.state as decision_state,
  d.priority,
  d.confidence,
  d.topic_key,
  d.content_key,
  d.rationale as decision_rationale,
  d.scheduled_for,
  d.delivery_ref,
  d.delivery_evidence,
  d.learning_evidence,
  o.generated_at,
  o.approved_at,
  o.dispatched_at,
  o.published_at,
  o.live_proven_at,
  o.measured_at,
  o.learned_at,
  (o.publication_date = (timezone('Europe/Amsterdam', now()))::date) as is_due_today,
  (o.publication_date < (timezone('Europe/Amsterdam', now()))::date
    and o.status not in ('LIVE_PROVEN','MEASURED','LEARNED','SKIPPED')) as is_overdue,
  greatest(o.updated_at, coalesce(d.updated_at,o.updated_at)) as updated_at
from public.content_publication_obligations o
left join experiment_one e
  on e.tenant_id=o.tenant_id
 and e.experiment_id=o.experiment_id
 and e.calendar_date=o.publication_date
left join public.powerhouse_channel_decisions d
  on d.run_date=o.publication_date
 and d.channel=o.channel;
