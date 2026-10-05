create or replace function public.prevent_content_ready_state_regression_v1()
returns trigger
language plpgsql
set search_path=public,pg_catalog
as $$
begin
  if old.state='content_ready' and new.state='decided' and new.decision='publish' then
    if exists (select 1 from public.powerhouse_content_artifacts a where a.run_date=new.run_date and a.channel=new.channel and a.status='content_ready') then
      new.state := 'content_ready';
      new.delivery_evidence := coalesce(new.delivery_evidence,'{}'::jsonb) || jsonb_build_object('state_regression_prevented_at',now(),'state_regression_fingerprint','content-ready-to-decided-regression-v1');
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists trg_prevent_content_ready_state_regression_v1 on public.powerhouse_channel_decisions;
create trigger trg_prevent_content_ready_state_regression_v1 before update on public.powerhouse_channel_decisions for each row execute function public.prevent_content_ready_state_regression_v1();
