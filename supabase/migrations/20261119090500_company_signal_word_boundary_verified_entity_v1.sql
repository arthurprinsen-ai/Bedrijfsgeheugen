-- Verified company entity for external signals (v1)
-- Root cause: powerhouse_company_signal_resolution_v1 matched bg_connecties.bedrijf as a raw substring
-- (LIKE '%anva%') of news text, so "anva" matched "Canvas", "appen" matched "toepassen", "ster" matched "meester".
-- Those fragments became powerhouse_predictive_signals.entity_key, then trigger research actions that
-- could never get a domain/KvK/decision maker and expired after 24h.
-- Reuse-first: same view, same columns, same daily resolver (powerhouse_resolve_company_person_signals_v1).
-- No data is deleted: older fragment rows stay as evidence but are no longer read as company triggers.

create or replace view public.powerhouse_company_signal_resolution_v1
with (security_invoker=true) as
with companies as (
  select distinct
    lower(regexp_replace(trim(c.bedrijf),'\s+',' ','g')) as company_key,
    trim(c.bedrijf) as company_name
  from public.bg_connecties c
  where nullif(trim(coalesce(c.bedrijf,'')),'') is not null
), news as (
  select 'company_news'::text as source_type, n.url as source_ref, n.bedrijf as source_company,
    n.titel as headline, n.haak as summary, n.soort as signal_type,
    coalesce(n.gepubliceerd_op,n.opgehaald_op) as observed_at,
    least(1::numeric,greatest(0::numeric,coalesce(n.zekerheid,0.5))) as confidence
  from public.bg_bedrijfsnieuws n
  where n.over_dit_bedrijf is true and coalesce(n.afgewezen_reden,'')=''
), ext as (
  select 'external_signal'::text as source_type, e.url as source_ref, null::text as source_company,
    e.titel as headline, e.samenvatting as summary, e.onderwerp as signal_type,
    coalesce(e.gepubliceerd_op,e.opgehaald_op) as observed_at,
    least(1::numeric,greatest(0::numeric,
      coalesce(e.vertrouwen,0::numeric)*0.55+coalesce(e.relevantie,0::numeric)*0.20
      +coalesce(e.brontrouw,0::numeric)*0.15+coalesce(e.bevestiging,0::numeric)*0.10)) as confidence
  from public.bg_externe_signalen e
  where e.toegestaan is true and coalesce(e.ruis_reden,'')=''
), signals as (
  select * from news
  union all
  select * from ext
), matched as (
  select c.company_key, c.company_name, s.source_type, s.source_ref, s.headline, s.summary,
    s.signal_type, s.observed_at, s.confidence,
    case
      when s.source_company is not null
        and lower(regexp_replace(trim(s.source_company),'\s+',' ','g'))=c.company_key
        then 'canonical_company'
      -- verified mention: whole word, exact spelling as in the connection, capitalised name,
      -- not a common Dutch/English word or month
      when s.source_company is null
        and length(c.company_name)>=4
        and c.company_name ~ '^[[:upper:]]'
        and c.company_key <> all (array[
          'april','augustus','december','februari','januari','juli','juni','maart','mei','november','oktober','september',
          'datum','deel','deal','geen','maak','home','global','divers','branch','actief','target','force','chill','inter',
          'maak','staan','meer','groep','groups','holding','nederland','digital','solutions','services','systems','software'
        ])
        and concat_ws(' ',s.headline,s.summary) ~ (
          '(^|[^[:alnum:]])'
          ||regexp_replace(c.company_name,'([.^$*+?()\[\]{}|\\])','\\\1','g')
          ||'([^[:alnum:]]|$)')
        then 'explicit_company_mention_wb'
      else null
    end as resolution_method
  from companies c
  join signals s
    on (s.source_company is not null
        and lower(regexp_replace(trim(s.source_company),'\s+',' ','g'))=c.company_key)
    or (s.source_company is null and length(c.company_name)>=4
        and lower(concat_ws(' ',s.headline,s.summary)) like '%'||lower(c.company_name)||'%')
  where s.observed_at>=now()-interval '180 days'
)
select company_key, company_name, source_type, source_ref, headline, summary, signal_type,
  observed_at, confidence, resolution_method
from matched
where resolution_method is not null;

-- The trigger intelligence view keeps reading the same sources, but no longer treats legacy
-- substring-resolved fragments or its own growth-swarm output as company trigger evidence.
do $$
declare
  v_def text;
  v_new text;
begin
  v_def:=pg_get_viewdef('public.powerhouse_mkb_trigger_intelligence_v1'::regclass,true);
  v_new:=replace(v_def,
    's.entity_scope = ''company''::text',
    's.entity_scope = ''company''::text AND (s.signal_key !~~ ''resolved-company:%'' OR COALESCE(s.evidence ->> ''resolution_method''::text, ''''::text) = ANY (ARRAY[''canonical_company''::text, ''explicit_company_mention_wb''::text]))');
  if v_new=v_def then
    raise exception 'TRIGGER_VIEW_PREDICTIVE_FILTER_NOT_APPLIED';
  end if;
  v_def:=v_new;
  v_new:=replace(v_def,
    'e.company_key IS NOT NULL',
    'e.company_key IS NOT NULL AND e.source !~~ ''powerhouse-growth-swarm%''');
  if v_new=v_def then
    raise exception 'TRIGGER_VIEW_SWARM_FEEDBACK_FILTER_NOT_APPLIED';
  end if;
  execute 'create or replace view public.powerhouse_mkb_trigger_intelligence_v1 with (security_invoker=true) as '||v_new;
end $$;

-- Internal views: server-side only.
revoke all on public.powerhouse_company_signal_resolution_v1 from public, anon, authenticated;
revoke all on public.powerhouse_mkb_trigger_intelligence_v1 from public, anon, authenticated;
