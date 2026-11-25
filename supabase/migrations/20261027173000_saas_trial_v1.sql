-- 30-day free trial (no payment method). Trial rows live in saas_subscriptions with provider='trial', status='trialing'.
-- Expiry: a daily job turns lapsed trials into 'canceled' so entitlements stop; paying converts the trial to a Mollie subscription.

create or replace function public.saas_expire_trials_v1(p_now timestamptz default now())
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_expired integer;
begin
  update public.saas_subscriptions
     set status = 'canceled', updated_at = p_now
   where provider = 'trial'
     and status = 'trialing'
     and current_period_end is not null
     and current_period_end < p_now;
  get diagnostics v_expired = row_count;
  return jsonb_build_object('expired', v_expired, 'at', p_now);
end;
$$;

revoke all on function public.saas_expire_trials_v1(timestamptz) from public, anon, authenticated;

-- Expose the trial end date to the portal (new column at the end keeps CREATE OR REPLACE valid).
create or replace view public.saas_active_entitlements with (security_invoker = true) as
 select s.organisation_id,
        s.plan_code,
        s.status,
        p.name as plan_name,
        p.monthly_price_cents,
        jsonb_object_agg(e.entitlement_key, e.entitlement_value order by e.entitlement_key) as entitlements,
        max(s.current_period_end) as current_period_end
   from public.saas_subscriptions s
   join public.saas_plans p on p.code = s.plan_code
   join public.saas_plan_entitlements e on e.plan_code = s.plan_code
  where s.status = any (array['trialing'::text, 'active'::text, 'past_due'::text])
  group by s.organisation_id, s.plan_code, s.status, p.name, p.monthly_price_cents;

revoke all on table public.saas_active_entitlements from public, anon, authenticated;
grant select on table public.saas_active_entitlements to service_role;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'saas-expire-trials-daily-v1';
    perform cron.schedule('saas-expire-trials-daily-v1', '40 3 * * *', $c$select public.saas_expire_trials_v1();$c$);
  end if;
end $$;
