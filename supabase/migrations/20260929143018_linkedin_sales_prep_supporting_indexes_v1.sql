create index if not exists bg_connecties_linkedin_url_norm_idx
           on public.bg_connecties ((lower(trim(linkedin_url))))
           where linkedin_url is not null;
         create index if not exists powerhouse_runtime_events_person_recent_idx
           on public.powerhouse_runtime_events(person_key,occurred_at desc)
           where person_key is not null;
         create index if not exists powerhouse_sales_actions_person_executed_idx
           on public.powerhouse_sales_actions(person_key,executed_at desc)
           where person_key is not null;
