-- 1. De connecties zelf, in Supabase in plaats van alleen in Notion
create table if not exists public.bg_connecties (
  linkedin_url text primary key,
  naam text,
  bedrijf text,
  rol text,
  segment text,
  prioriteit numeric default 50,
  email text,
  telefoon text,
  whatsapp_toegestaan boolean default false,
  aanleiding text,
  status text not null default 'nieuw',
  laatst_aangeboden_op timestamptz,
  laatste_uitkomst text,
  bron text default 'notion',
  extra jsonb not null default '{}'::jsonb,
  aangemaakt_op timestamptz not null default now(),
  bijgewerkt_op timestamptz not null default now(),
  constraint bg_connecties_status_check check (status in ('nieuw','aangeboden','in_gesprek','klant','geen_match','rust'))
);

create index if not exists bg_connecties_status_idx on public.bg_connecties (status);
create index if not exists bg_connecties_prioriteit_idx on public.bg_connecties (prioriteit desc);

alter table public.bg_connecties enable row level security;
revoke all on public.bg_connecties from anon, authenticated;
grant select on public.bg_connecties to service_role;

-- 2. Score: wat maakt een connectie vandaag het meest de moeite
create or replace view public.bg_connectiescore as
select c.linkedin_url, c.naam, c.bedrijf, c.rol, c.segment, c.status,
       round(
         coalesce(c.prioriteit, 50)
         + case when c.rol ~* '(directeur|eigenaar|founder|oprichter|ceo|owner|mede-eigenaar)' then 20 else 0 end
         + case when c.segment ~* '(directeur|eigenaar|mkb)' then 10 else 0 end
         + case when coalesce(c.email,'') <> '' then 5 else 0 end
         + case when c.aanleiding is not null and length(c.aanleiding) > 10 then 8 else 0 end
         - case when c.laatst_aangeboden_op > now() - interval '30 days' then 40 else 0 end
       , 1) as score
from public.bg_connecties c;

grant select on public.bg_connectiescore to service_role;

-- 3. Token waarmee de dagselectie connecties aanbiedt aan het brein
do $$
declare v_token text := encode(gen_random_bytes(24),'hex');
begin
  if not exists (select 1 from vault.decrypted_secrets where name='bg_connecties_ingest_token') then
    perform vault.create_secret(v_token,'bg_connecties_ingest_token','Token waarmee bg_connecties_dagselectie connecties aanbiedt aan powerhouse-runtime');
    insert into public.powerhouse_device_tokens(token_hash,label,scopes,active)
    values (encode(digest(v_token,'sha256'),'hex'),'bg-connecties dagselectie', array['ingest'], true);
  end if;
end $$;

-- 4. De dagelijkse selectie: de beste N connecties naar het brein, dat er een bericht bij schrijft
create or replace function public.bg_connecties_dagselectie(p_aantal integer default 20)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_token text;
  r record;
  v_aantal integer := 0;
begin
  select decrypted_secret into v_token from vault.decrypted_secrets
  where name='bg_connecties_ingest_token' order by created_at desc limit 1;
  if v_token is null then raise exception 'TOKEN_ONTBREEKT'; end if;

  for r in
    select c.*, s.score
    from public.bg_connecties c
    join public.bg_connectiescore s on s.linkedin_url = c.linkedin_url
    where c.status = 'nieuw'
      and (c.laatst_aangeboden_op is null or c.laatst_aangeboden_op < now() - interval '60 days')
      and not exists (
        select 1 from public.powerhouse_sales_actions a
        where a.subject_key = c.linkedin_url and a.status in ('suggested','done'))
    order by s.score desc, c.aangemaakt_op
    limit greatest(1, least(p_aantal, 100))
  loop
    perform net.http_post(
      url := 'https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/powerhouse-runtime/ingest',
      headers := jsonb_build_object('content-type','application/json','x-powerhouse-token',v_token),
      body := jsonb_build_object('event', jsonb_build_object(
        'event_type','connection_activated',
        'source','bg-connecties',
        'profileUrl', r.linkedin_url,
        'subject_key', r.linkedin_url,
        'person_key', r.linkedin_url,
        'personName', r.naam,
        'company', r.bedrijf,
        'company_key', r.bedrijf,
        'role', r.rol,
        'email', r.email,
        'phone', r.telefoon,
        'whatsappAllowed', coalesce(r.whatsapp_toegestaan,false),
        'reason', coalesce(r.aanleiding, r.naam || ' staat als commerciële activatiekans open.'),
        'priority', r.score,
        'topic_key', coalesce(r.segment,'connectie-activatie'),
        'dataQuality','OBSERVED',
        'confidence',0.6)));

    update public.bg_connecties
      set status='aangeboden', laatst_aangeboden_op=now(), bijgewerkt_op=now()
    where linkedin_url = r.linkedin_url;
    v_aantal := v_aantal + 1;
  end loop;

  return jsonb_build_object('aangeboden', v_aantal, 'op', now());
end;
$$;

-- 5. Elke werkdag om 05:45, vóór de dagelijkse pas van 06:05
select cron.schedule('bg-connecties-dagselectie','45 5 * * 1-5',
  $$select public.bg_connecties_dagselectie(20);$$);

-- 6. Namen aanvullen in het dagoverzicht vanuit de connectietabel
create or replace view public.bg_vandaag as
select round(a.priority) as prioriteit,
       coalesce(nullif(a.person_name,''), c.naam, '?') as persoon,
       coalesce(nullif(a.company_name,''), c.bedrijf, '') as bedrijf,
       coalesce(nullif(a.role,''), c.rol, '') as rol,
       a.channel as kanaal,
       a.action_type as soort,
       a.message_draft as tekst_om_te_versturen,
       a.reason as waarom,
       coalesce(a.source_url, c.linkedin_url) as link,
       a.action_id::text as action_id
from public.powerhouse_sales_actions a
left join public.bg_connecties c on c.linkedin_url = a.subject_key
where a.status = 'suggested'
  and coalesce(a.subject_key,'') not ilike '%test%'
order by a.priority desc;

grant select on public.bg_vandaag to authenticated, service_role;

-- 7. Stand van zaken
create or replace view public.bg_connecties_stand as
select status, count(*) as aantal, round(avg(prioriteit),1) as gemiddelde_prioriteit
from public.bg_connecties group by status order by aantal desc;

grant select on public.bg_connecties_stand to service_role;
