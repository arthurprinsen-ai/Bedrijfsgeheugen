-- 1. Prestatie per post: laatste meting per post, met een interactiepercentage
create or replace view public.bg_post_prestatie as
with laatste as (
  select distinct on (post_id) post_id, metrics, observed_at
  from public.social_metric_snapshots order by post_id, observed_at desc
)
select p.post_id, p.platform, p.published_at,
       extract(dow from p.published_at) as weekdag,
       extract(hour from p.published_at) as uur,
       p.topic, p.content_pillar, p.format, p.hook_type, p.narrative_type, p.emotion, p.cta_type,
       coalesce((l.metrics->>'impressions')::numeric,0) as impressies,
       coalesce((l.metrics->>'reach')::numeric,0) as bereik,
       coalesce((l.metrics->>'likes')::numeric,0) as likes,
       coalesce((l.metrics->>'comments')::numeric,0) as reacties,
       coalesce((l.metrics->>'shares')::numeric,0) as gedeeld,
       coalesce((l.metrics->>'clicks')::numeric,0) as kliks,
       coalesce((l.metrics->>'profile_visits')::numeric,0) as profielbezoek,
       round(100.0 * (coalesce((l.metrics->>'likes')::numeric,0)
                    + coalesce((l.metrics->>'comments')::numeric,0)
                    + coalesce((l.metrics->>'shares')::numeric,0))
             / nullif(coalesce((l.metrics->>'impressions')::numeric,0),0), 2) as interactie_pct
from public.social_posts p
left join laatste l on l.post_id = p.post_id;

grant select on public.bg_post_prestatie to service_role;

-- 2. De schrijfregels: wat de volgende post moet doen, met bewijs erbij
create table if not exists public.bg_schrijfregels (
  regel_id text primary key,
  onderwerp text not null,
  regel text not null,
  onderbouwing text,
  bewijs_n integer not null default 0,
  vertrouwen numeric not null default 0,
  status text not null default 'voorlopig',
  bron text not null default 'metingen',
  bijgewerkt_op timestamptz not null default now(),
  constraint bg_schrijfregels_status_check check (status in ('voorlopig','actief','te weinig bewijs','vervallen'))
);
alter table public.bg_schrijfregels enable row level security;
revoke all on public.bg_schrijfregels from anon, authenticated;
grant select on public.bg_schrijfregels to service_role;

-- 3. De intelligentielaag: leidt regels af uit de metingen, elke dag opnieuw
create or replace function public.bg_content_lessen()
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_n integer; v_reacties numeric; v_impressies numeric; v_geclassificeerd integer;
  v_geschreven integer := 0;
begin
  select count(*), sum(reacties), sum(impressies),
         count(*) filter (where hook_type is not null)
    into v_n, v_reacties, v_impressies, v_geclassificeerd
  from public.bg_post_prestatie where impressies > 0;

  -- Regel: levert de slotvraag reacties op?
  if v_n >= 8 then
    insert into public.bg_schrijfregels (regel_id, onderwerp, regel, onderbouwing, bewijs_n, vertrouwen, status)
    values ('slotvraag','Slotvraag',
      case when v_reacties = 0
           then 'De huidige slotvraag levert geen reacties op. Vraag niet om een mening maar om een concreet voorbeeld uit hun eigen week, en stel de vraag aan één type lezer.'
           else 'De slotvraag levert reacties op; huidige vraagvorm aanhouden.' end,
      format('%s posts met bereik, samen %s reacties op %s impressies.', v_n, v_reacties, v_impressies),
      v_n, least(0.9, 0.4 + v_n * 0.03), 'actief')
    on conflict (regel_id) do update set regel=excluded.regel, onderbouwing=excluded.onderbouwing,
      bewijs_n=excluded.bewijs_n, vertrouwen=excluded.vertrouwen, status=excluded.status, bijgewerkt_op=now();
    v_geschreven := v_geschreven + 1;
  end if;

  -- Regel: welk kanaal verdient de moeite
  insert into public.bg_schrijfregels (regel_id, onderwerp, regel, onderbouwing, bewijs_n, vertrouwen, status)
  select 'kanaalkeuze','Kanaalkeuze',
    format('Zet het zwaartepunt op %s: daar staat het gemiddelde bereik op %s per post.', platform, round(avg(impressies))),
    format('%s posts gemeten op dit kanaal.', count(*)),
    count(*)::int, least(0.85, 0.35 + count(*) * 0.03),
    case when count(*) >= 5 then 'actief' else 'te weinig bewijs' end
  from public.bg_post_prestatie where impressies > 0
  group by platform order by avg(impressies) desc limit 1
  on conflict (regel_id) do update set regel=excluded.regel, onderbouwing=excluded.onderbouwing,
    bewijs_n=excluded.bewijs_n, vertrouwen=excluded.vertrouwen, status=excluded.status, bijgewerkt_op=now();
  v_geschreven := v_geschreven + 1;

  -- Regel: welke haak werkt, alleen als de posts geclassificeerd zijn
  if v_geclassificeerd >= 6 then
    insert into public.bg_schrijfregels (regel_id, onderwerp, regel, onderbouwing, bewijs_n, vertrouwen, status)
    select 'haaktype','Haaktype',
      format('Gebruik het haaktype "%s": gemiddeld %s%% interactie tegen %s%% over alle posts.',
             hook_type, round(avg(interactie_pct),2),
             (select round(avg(interactie_pct),2) from public.bg_post_prestatie where impressies > 0)),
      format('%s posts met dit haaktype.', count(*)),
      count(*)::int, least(0.85, 0.35 + count(*) * 0.05),
      case when count(*) >= 3 then 'actief' else 'te weinig bewijs' end
    from public.bg_post_prestatie
    where impressies > 0 and hook_type is not null
    group by hook_type order by avg(interactie_pct) desc nulls last limit 1
    on conflict (regel_id) do update set regel=excluded.regel, onderbouwing=excluded.onderbouwing,
      bewijs_n=excluded.bewijs_n, vertrouwen=excluded.vertrouwen, status=excluded.status, bijgewerkt_op=now();
    v_geschreven := v_geschreven + 1;
  else
    insert into public.bg_schrijfregels (regel_id, onderwerp, regel, onderbouwing, bewijs_n, vertrouwen, status)
    values ('haaktype','Haaktype',
      'Nog geen uitspraak mogelijk over haaktypes: de gepubliceerde posts zijn niet geclassificeerd.',
      format('%s van de %s gemeten posts hebben een ingevuld haaktype.', v_geclassificeerd, v_n),
      v_geclassificeerd, 0, 'te weinig bewijs')
    on conflict (regel_id) do update set regel=excluded.regel, onderbouwing=excluded.onderbouwing,
      bewijs_n=excluded.bewijs_n, vertrouwen=excluded.vertrouwen, status=excluded.status, bijgewerkt_op=now();
    v_geschreven := v_geschreven + 1;
  end if;

  -- Regel: brengt een post iemand naar de site
  insert into public.bg_schrijfregels (regel_id, onderwerp, regel, onderbouwing, bewijs_n, vertrouwen, status)
  select 'doorklik','Doorklik naar de site',
    case when sum(kliks) = 0
         then 'Geen enkele gemeten post levert een klik naar de site op. Zet in élke post een meetbare link, anders blijft het bereik zonder gevolg.'
         else format('Posts leveren kliks op (%s gemeten); deze vorm van verwijzen aanhouden.', sum(kliks)) end,
    format('%s posts gemeten, %s kliks in totaal.', count(*), sum(kliks)),
    count(*)::int, least(0.9, 0.4 + count(*) * 0.03),
    case when count(*) >= 5 then 'actief' else 'te weinig bewijs' end
  from public.bg_post_prestatie where impressies > 0
  on conflict (regel_id) do update set regel=excluded.regel, onderbouwing=excluded.onderbouwing,
    bewijs_n=excluded.bewijs_n, vertrouwen=excluded.vertrouwen, status=excluded.status, bijgewerkt_op=now();
  v_geschreven := v_geschreven + 1;

  return jsonb_build_object('regels', v_geschreven, 'posts_gemeten', v_n,
                            'posts_geclassificeerd', v_geclassificeerd, 'op', now());
end;
$$;

-- 4. Elke werkdag om 06:20, na de dagelijkse pas van het brein
select cron.schedule('bg-content-lessen','20 6 * * 1-5', $$select public.bg_content_lessen();$$);
