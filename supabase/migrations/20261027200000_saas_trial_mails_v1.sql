-- Proefperiode-mails: logtabel (idempotent per proef en mail), selectie van wie een mail krijgt, leeroverzicht per variant, dagelijkse run.

create table if not exists public.saas_trial_mails (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.saas_subscriptions(id) on delete cascade,
  organisation_id uuid not null,
  email text not null,
  mail_key text not null check (mail_key in ('d23', 'd29', 'expired')),
  variant text not null check (variant in ('A', 'B')),
  segment text not null,
  status text not null check (status in ('claimed', 'sent', 'unverified', 'skipped', 'error')),
  subject text,
  provider_message_id text,
  error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  unique (subscription_id, mail_key)
);

alter table public.saas_trial_mails enable row level security;
revoke all on table public.saas_trial_mails from public, anon, authenticated;
grant select, insert, update on table public.saas_trial_mails to service_role;

create or replace function public.saas_trial_mail_due_v1(p_now timestamptz default now())
returns table (
  subscription_id uuid, organisation_id uuid, email text, bedrijf text,
  plan_code text, plan_name text, monthly_price_cents integer, period_end timestamptz,
  mail_key text, koppelingen integer, scans integer, laatste_score numeric, ai_vragen numeric
)
language sql
security definer
set search_path = ''
as $$
  with t as (
    select s.id as sid, s.organisation_id as oid, s.plan_code, s.status, s.current_period_end as pe,
           lower(s.metadata ->> 'trial_email') as mail, o.naam
      from public.saas_subscriptions s
      join public.organisaties o on o.id = s.organisation_id
     where s.provider = 'trial'
       and coalesce(s.metadata ->> 'trial_email', '') <> ''
       and (s.metadata ->> 'trial_email') not ilike '%@bedrijfsgeheugen.nl'
       and s.current_period_end is not null
  ), k as (
    select t.*,
           case
             when t.status = 'canceled' and t.pe <= p_now and t.pe > p_now - interval '3 days' then 'expired'
             when t.status = 'trialing' and t.pe > p_now and t.pe <= p_now + interval '2 days' then 'd29'
             when t.status = 'trialing' and t.pe > p_now + interval '2 days' and t.pe <= p_now + interval '7 days' then 'd23'
           end as mk
      from t
  )
  select k.sid, k.oid, k.mail, k.naam, k.plan_code, p.name, p.monthly_price_cents::integer, k.pe, k.mk,
         (select count(*)::integer from public.bg_integrations i where i.organisatie_id = k.oid::text),
         (select count(*)::integer from public.powerhouse_scan_history_v1 h where h.organisatie_id = k.oid),
         (select h.score from public.powerhouse_scan_history_v1 h where h.organisatie_id = k.oid order by h.scan_datum desc, h.aangemaakt desc limit 1),
         (select coalesce(sum(u.used), 0) from public.saas_usage_counters u where u.organisation_id = k.oid and u.meter_key ilike 'ai%')
    from k
    join public.saas_plans p on p.code = k.plan_code
   where k.mk is not null
     and not exists (
       select 1 from public.saas_subscriptions m
        where m.organisation_id = k.oid and m.provider <> 'trial' and m.status in ('active', 'past_due'))
     and not exists (
       select 1 from public.saas_trial_mails x where x.subscription_id = k.sid and x.mail_key = k.mk)
$$;

revoke all on function public.saas_trial_mail_due_v1(timestamptz) from public, anon, authenticated;
grant execute on function public.saas_trial_mail_due_v1(timestamptz) to service_role;

create or replace view public.saas_trial_mail_learning_v1 with (security_invoker = true) as
 select m.mail_key, m.variant, m.segment,
        count(*) filter (where m.status = 'sent') as sent,
        count(*) filter (where m.status = 'sent' and exists (
          select 1 from public.saas_subscriptions p
           where p.organisation_id = m.organisation_id and p.provider <> 'trial'
             and p.status in ('active', 'past_due')
             and p.created_at >= m.sent_at and p.created_at <= m.sent_at + interval '14 days')) as converted_14d
   from public.saas_trial_mails m
  group by m.mail_key, m.variant, m.segment;

revoke all on table public.saas_trial_mail_learning_v1 from public, anon, authenticated;
grant select on table public.saas_trial_mail_learning_v1 to service_role;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'bg-trial-lifecycle-mail-daily-v1';
    perform cron.schedule('bg-trial-lifecycle-mail-daily-v1', '7 7 * * *', $c$select net.http_post(url := 'https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/bg-trial-lifecycle-mail', headers := jsonb_build_object('content-type','application/json','x-powerhouse-token',(select decrypted_secret from vault.decrypted_secrets where name='powerhouse_daily_scheduler_token' order by created_at desc limit 1)), body := jsonb_build_object('mode','live'), timeout_milliseconds := 60000);$c$);
    perform cron.unschedule(jobid) from cron.job where jobname = 'bg-trial-lifecycle-report-weekly-v1';
    perform cron.schedule('bg-trial-lifecycle-report-weekly-v1', '17 7 * * 1', $c$select net.http_post(url := 'https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/bg-trial-lifecycle-mail', headers := jsonb_build_object('content-type','application/json','x-powerhouse-token',(select decrypted_secret from vault.decrypted_secrets where name='powerhouse_daily_scheduler_token' order by created_at desc limit 1)), body := jsonb_build_object('mode','report'), timeout_milliseconds := 30000);$c$);
  end if;
end;
$$;
