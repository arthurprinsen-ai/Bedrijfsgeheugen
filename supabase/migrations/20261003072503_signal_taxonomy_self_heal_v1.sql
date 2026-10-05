create table if not exists public.bg_signaal_onderwerp_autoprovision_audit (
  onderwerp text primary key,
  eerste_gezien_op timestamptz not null default now(),
  laatst_gezien_op timestamptz not null default now(),
  eerste_url text,
  laatste_url text,
  domein text,
  brontrouw numeric,
  vertrouwen numeric,
  relevantie numeric,
  actief_aangemaakt boolean not null default false,
  activatie_reden text not null,
  waarnemingen integer not null default 1 check (waarnemingen > 0),
  evidence jsonb not null default '{}'::jsonb
);

comment on table public.bg_signaal_onderwerp_autoprovision_audit is
'Append/upsert audit authority for self-healing signal taxonomy provisioning. Browser clients have no direct access.';

alter table public.bg_signaal_onderwerp_autoprovision_audit enable row level security;
revoke all on table public.bg_signaal_onderwerp_autoprovision_audit from anon, authenticated;

create or replace function public.bg_ensure_signaal_onderwerp_v1()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_topic text;
  v_active boolean;
  v_pillar text;
  v_reason text;
  v_query text;
begin
  v_topic := nullif(btrim(coalesce(new.onderwerp,'')), '');
  if v_topic is null then
    return new;
  end if;

  new.onderwerp := left(v_topic, 180);

  if exists (
    select 1 from public.bg_signaal_onderwerpen o
    where o.onderwerp = new.onderwerp
  ) then
    return new;
  end if;

  v_active :=
    coalesce(new.toegestaan,false)
    and coalesce(new.brontrouw,0) >= 0.80
    and coalesce(new.vertrouwen,0) >= 0.75
    and coalesce(new.relevantie,0) >= 0.50
    and nullif(btrim(coalesce(new.url,'')), '') is not null
    and nullif(btrim(coalesce(new.titel,'')), '') is not null;

  v_pillar := case
    when lower(coalesce(new.onderwerp,'') || ' ' || coalesce(new.titel,'') || ' ' || coalesce(new.samenvatting,'')) ~
         '(subsid|regeling|financier|investering|fonds|budget|aanvraag|showcase|onderzoeksproject)'
      then 'Investering & digitalisering'
    when lower(coalesce(new.onderwerp,'') || ' ' || coalesce(new.titel,'') || ' ' || coalesce(new.samenvatting,'')) ~
         '(^|[^a-z])(ai|artifici[eë]le intelligentie|machine learning|copilot)([^a-z]|$)'
      then 'AI'
    when lower(coalesce(new.onderwerp,'') || ' ' || coalesce(new.titel,'') || ' ' || coalesce(new.samenvatting,'')) ~
         '(personeel|arbeid|zzp|dba|werkgever|werknemer|hr)'
      then 'Regeldruk & personeel'
    when lower(coalesce(new.onderwerp,'') || ' ' || coalesce(new.titel,'') || ' ' || coalesce(new.samenvatting,'')) ~
         '(overdracht|fusie|overname|m&a|opvolging)'
      then 'Kennisverlies'
    else 'Automatisering'
  end;

  v_query := left(new.onderwerp || ' mkb Nederland actueel', 500);
  v_reason := case
    when v_active then 'trusted_signal_auto_activated'
    else 'unknown_topic_created_inactive_pending_more_evidence'
  end;

  insert into public.bg_signaal_onderwerpen
    (onderwerp, zoekvraag, actief, segmenten, contentpijler)
  values
    (
      new.onderwerp,
      v_query,
      v_active,
      array['Directeur / eigenaar']::text[],
      v_pillar
    )
  on conflict (onderwerp) do nothing;

  insert into public.bg_signaal_onderwerp_autoprovision_audit
    (
      onderwerp, eerste_url, laatste_url, domein,
      brontrouw, vertrouwen, relevantie,
      actief_aangemaakt, activatie_reden, evidence
    )
  values
    (
      new.onderwerp, new.url, new.url, new.domein,
      new.brontrouw, new.vertrouwen, new.relevantie,
      v_active, v_reason,
      jsonb_build_object(
        'contract','bg-signal-taxonomy-self-heal-v1',
        'title',new.titel,
        'allowed',new.toegestaan,
        'source_observed_at',coalesce(new.opgehaald_op,now()),
        'content_pillar',v_pillar,
        'search_query',v_query
      )
    )
  on conflict (onderwerp) do update
    set laatst_gezien_op = now(),
        laatste_url = excluded.laatste_url,
        domein = excluded.domein,
        brontrouw = excluded.brontrouw,
        vertrouwen = excluded.vertrouwen,
        relevantie = excluded.relevantie,
        waarnemingen = public.bg_signaal_onderwerp_autoprovision_audit.waarnemingen + 1,
        evidence = public.bg_signaal_onderwerp_autoprovision_audit.evidence || excluded.evidence;

  return new;
end;
$$;

revoke all on function public.bg_ensure_signaal_onderwerp_v1() from public, anon, authenticated;

drop trigger if exists trg_bg_externe_signalen_ensure_onderwerp_v1 on public.bg_externe_signalen;
create trigger trg_bg_externe_signalen_ensure_onderwerp_v1
before insert or update of onderwerp
on public.bg_externe_signalen
for each row
execute function public.bg_ensure_signaal_onderwerp_v1();

comment on function public.bg_ensure_signaal_onderwerp_v1() is
'Fail-safe taxonomy gate: unknown external-signal topics are atomically provisioned before FK validation. Strong evidence auto-activates; weaker evidence is retained inactive. Direct taxonomy access remains protected.';

insert into public.powerhouse_loop_assurance_registry_v1
  (loop_key,label,runtime_source,expected_cadence_minutes,critical,required_stages,active,evidence_contract)
values
  (
    'signal-taxonomy-self-heal',
    'Signal taxonomy self-healing',
    'postgres-trigger:trg_bg_externe_signalen_ensure_onderwerp_v1',
    1440,
    true,
    array['input','decision','action','readback','guard']::text[],
    true,
    jsonb_build_object(
      'contract','bg-signal-taxonomy-self-heal-v1',
      'parent_table','bg_signaal_onderwerpen',
      'child_table','bg_externe_signalen',
      'audit_table','bg_signaal_onderwerp_autoprovision_audit',
      'policy','unknown topics never block child insert; strong evidence activates, weak evidence stays inactive'
    )
  )
on conflict (loop_key) do update
set label=excluded.label,
    runtime_source=excluded.runtime_source,
    expected_cadence_minutes=excluded.expected_cadence_minutes,
    critical=excluded.critical,
    required_stages=excluded.required_stages,
    active=true,
    evidence_contract=excluded.evidence_contract,
    updated_at=now();
