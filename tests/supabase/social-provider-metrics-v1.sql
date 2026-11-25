-- Native disposable Supabase Preview: verify exactly one enabled provider-ingest cron.
do $verify$
declare v_count integer;
begin
  select count(*) into v_count
  from cron.job
  where jobname='bg-social-metrics-source-6h-v1'
    and active=true and command like '%/functions/v1/bg-social-metrics-sync%';
  if v_count<>1 then
    raise exception 'SOCIAL_PROVIDER_CRON_MISSING_OR_DUPLICATE: %',v_count;
  end if;
  if not exists(select 1 from public.powerhouse_evidence_sources where source_key='instagram-social')
    or not exists(select 1 from public.powerhouse_evidence_sources where source_key='linkedin') then
    raise exception 'SOCIAL_CANONICAL_EVIDENCE_SOURCES_MISSING';
  end if;
  if not has_table_privilege('service_role','public.social_metric_snapshots','INSERT') then
    raise exception 'CANONICAL_SOCIAL_WRITE_AUTHORITY_MISSING';
  end if;
end $verify$;
