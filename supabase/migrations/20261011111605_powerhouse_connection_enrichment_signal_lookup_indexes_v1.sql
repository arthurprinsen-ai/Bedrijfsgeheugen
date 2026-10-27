
create index if not exists ph_runtime_company_norm_lookup_v1
on public.powerhouse_runtime_events
(lower(regexp_replace(trim(coalesce(company_key,'')),'\\s+',' ','g')),occurred_at desc);
create index if not exists ph_prediction_company_norm_lookup_v1
on public.powerhouse_predictive_signals
(lower(regexp_replace(trim(entity_key),'\\s+',' ','g')),observed_at desc)
where entity_scope='company';
create index if not exists ph_linkedin_actor_norm_lookup_v1
on public.linkedin_engagement_events
(lower(trim(actor_linkedin_url)),occurred_at desc)
where coalesce(is_test,false)=false and nullif(trim(actor_linkedin_url),'') is not null;
