
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
  v_exists boolean;
  v_auto_managed boolean;
begin
  v_topic := nullif(btrim(coalesce(new.onderwerp,'')), '');
  if v_topic is null then
    return new;
  end if;

  new.onderwerp := left(v_topic, 180);

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

  select exists(
    select 1 from public.bg_signaal_onderwerpen o where o.onderwerp = new.onderwerp
  ) into v_exists;

  select exists(
    select 1 from public.bg_signaal_onderwerp_autoprovision_audit a where a.onderwerp = new.onderwerp
  ) into v_auto_managed;

  if not v_exists then
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
  end if;

  if v_auto_managed then
    update public.bg_signaal_onderwerp_autoprovision_audit
    set laatst_gezien_op = now(),
        laatste_url = new.url,
        domein = new.domein,
        brontrouw = new.brontrouw,
        vertrouwen = new.vertrouwen,
        relevantie = new.relevantie,
        waarnemingen = waarnemingen + 1,
        activatie_reden = case when v_active then 'trusted_signal_promoted_active' else activatie_reden end,
        evidence = evidence || jsonb_build_object(
          'last_title',new.titel,
          'last_allowed',new.toegestaan,
          'last_observed_at',coalesce(new.opgehaald_op,now())
        )
    where onderwerp = new.onderwerp;

    if v_active then
      update public.bg_signaal_onderwerpen
      set actief = true,
          zoekvraag = coalesce(nullif(zoekvraag,''), v_query),
          contentpijler = coalesce(nullif(contentpijler,''), v_pillar)
      where onderwerp = new.onderwerp
        and actief = false;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_bg_externe_signalen_ensure_onderwerp_v1 on public.bg_externe_signalen;
create trigger trg_bg_externe_signalen_ensure_onderwerp_v1
before insert or update of onderwerp, toegestaan, brontrouw, vertrouwen, relevantie, titel, url
on public.bg_externe_signalen
for each row
execute function public.bg_ensure_signaal_onderwerp_v1();
