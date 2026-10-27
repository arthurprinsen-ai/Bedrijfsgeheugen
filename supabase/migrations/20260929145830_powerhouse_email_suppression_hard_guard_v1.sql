
create or replace function public.powerhouse_email_suppression_guard_v1()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_catalog
as $$
declare
  v_email text;
  v_reason text;
begin
  if new.channel <> 'email' or new.action_type <> 'autonomous_email' then
    return new;
  end if;

  v_email := lower(btrim(coalesce(new.evidence->>'recipient_email','')));
  if v_email = '' then
    return new;
  end if;

  select reason into v_reason
  from public.powerhouse_email_contact_suppressions
  where lower(email)=v_email and active=true
  limit 1;

  if found then
    new.status := 'skipped';
    new.evidence := coalesce(new.evidence,'{}'::jsonb) || jsonb_build_object(
      'suppressed',jsonb_build_object(
        'contract','powerhouse-email-reply-learning-v1',
        'reason',v_reason,
        'guard','powerhouse_email_suppression_guard_v1',
        'checked_at',now()
      )
    );
  end if;

  return new;
end;
$$;

drop trigger if exists powerhouse_email_suppression_guard on public.powerhouse_sales_actions;
create trigger powerhouse_email_suppression_guard
before insert or update of status,evidence,action_type,channel
on public.powerhouse_sales_actions
for each row execute function public.powerhouse_email_suppression_guard_v1();

revoke all on function public.powerhouse_email_suppression_guard_v1() from public, anon, authenticated;
