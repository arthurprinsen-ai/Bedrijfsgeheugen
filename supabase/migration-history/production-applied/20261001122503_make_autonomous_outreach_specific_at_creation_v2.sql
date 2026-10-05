
create or replace function public.powerhouse_prepare_autonomous_outreach_v1(
  p_run_date date default ((now() at time zone 'Europe/Amsterdam')::date)
) returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog','public'
as $function$
declare
  v_now timestamptz:=now();
  v_inserted integer:=0;
begin
  with daily_sent as (
    select count(*)::int n
    from public.powerhouse_sales_actions
    where action_type='autonomous_email'
      and status='done'
      and executed_at >= date_trunc('day',now() at time zone 'Europe/Amsterdam') at time zone 'Europe/Amsterdam'
  ), candidates as (
    select
      r.person_key,r.person_name,r.company_key,r.company_name,r.role,r.email,
      r.relationship_revenue_score,r.relationship_status,
      t.trigger_key,t.trigger_type,t.confidence,t.observed_at,t.trigger_evidence_ref,
      row_number() over(partition by r.person_key order by t.confidence desc,t.observed_at desc) person_rn
    from public.powerhouse_relationship_revenue_intelligence_v1 r
    join public.powerhouse_mkb_trigger_intelligence_v1 t on t.company_key=r.company_key
    where r.relationship_revenue_score>=.55
      and r.actions_30d<2
      and r.relationship_status in ('in_gesprek','aangeboden','rust')
      and nullif(trim(r.email),'') is not null
      and r.email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+[.][A-Z]{2,}$'
      and t.do_not_contact_reason is null
      and t.observed_at>=v_now-interval '30 days'
      and t.confidence>=.60
      and not exists (
        select 1 from public.powerhouse_sales_outcomes o
        where o.person_key=r.person_key
          and lower(coalesce(o.outcome_type,'')) in ('unsubscribe','opt_out','do_not_contact','complaint','negative_reply')
      )
      and not exists (
        select 1 from public.powerhouse_sales_actions a
        where a.person_key=r.person_key
          and a.channel='email'
          and a.status='done'
          and a.executed_at>=v_now-interval '30 days'
      )
      and not exists (
        select 1 from public.powerhouse_sales_actions a
        where a.person_key=r.person_key
          and a.action_type='reply_post'
          and a.channel='linkedin_personal'
          and (
            a.status in ('prepared','suggested','waiting')
            or (a.status='done' and a.executed_at>=v_now-interval '24 hours')
          )
      )
  ), ranked as (
    select c.*,row_number() over(order by c.relationship_revenue_score desc,c.confidence desc,c.observed_at desc,c.person_key) rn
    from candidates c where c.person_rn=1
  ), budget as (
    select greatest(0,5-(select n from daily_sent))::int slots
  )
  insert into public.powerhouse_sales_actions(
    dedupe_key,subject_key,person_key,company_key,action_type,channel,priority,reason,evidence,
    message_draft,source_url,status,due_at,expected_value_eur,person_name,company_name,role
  )
  select
    'relationship-auto-email:'||md5(r.person_key)||':'||md5(r.trigger_key),
    'relationship:'||r.person_key,r.person_key,r.company_key,
    'autonomous_email','email',
    round((100*(.65*r.relationship_revenue_score+.35*r.confidence))::numeric,2),
    'Existing relationship plus fresh evidence-backed company trigger; user-authorized bounded autonomous follow-up.',
    jsonb_build_object(
      'contract','powerhouse-autonomous-relationship-outreach-v2',
      'copy_contract','specific-context-value-question-v2',
      'recipient_email',r.email,
      'email_subject',
        case coalesce(r.trigger_type,'')
          when 'ai_data_digitalisation' then coalesce(nullif(r.company_name,''),'Even bijpraten')||': waar zit nog onnodig handwerk?'
          when 'erp_afas_change' then coalesce(nullif(r.company_name,''),'Even bijpraten')||': wat blijft na AFAS/ERP nog handmatig?'
          when 'turnaround' then coalesce(nullif(r.company_name,''),'Even bijpraten')||': waar lekt nu tijd of stuurkracht weg?'
          else coalesce(nullif(r.company_name,''),'Even bijpraten')||': één concrete vraag'
        end,
      'trigger_key',r.trigger_key,
      'trigger_type',r.trigger_type,
      'trigger_confidence',r.confidence,
      'trigger_observed_at',r.observed_at,
      'trigger_evidence_ref',r.trigger_evidence_ref,
      'relationship_status',r.relationship_status,
      'relationship_revenue_score',r.relationship_revenue_score,
      'authorization','user_authorized_autonomous_outbound_2026-09-28',
      'sequence_policy','linkedin_context_first_when_available',
      'guardrails',jsonb_build_object(
        'existing_relationship_only',true,
        'fresh_evidence_required',true,
        'max_daily_sends',5,
        'per_person_cooldown_days',30,
        'linkedin_comment_cooldown_hours',24,
        'respect_opt_out',true,
        'linkedin_dm_not_fabricated',true
      )
    ),
    'Hoi '||coalesce(nullif(split_part(trim(r.person_name),' ',1),''),'daar')||','||chr(10)||chr(10)||
    'Vanuit Bedrijfsgeheugen help ik MKB-organisaties om handmatig werk, versnipperde kennis en AI-kansen concreet te maken.'||chr(10)||chr(10)||
    'Ik zag bij '||coalesce(nullif(r.company_name,''),'jullie organisatie')||' een actueel signaal rond '||
    replace(coalesce(r.trigger_type,'een relevante ontwikkeling'),'_',' ')||'. Daarom leg ik je liever meteen één concrete vraag voor dan om een afspraak te vragen:'||chr(10)||chr(10)||
    case coalesce(r.trigger_type,'')
      when 'ai_data_digitalisation' then 'Welke terugkerende taak kost jullie nu het meeste handmatige werk terwijl de benodigde informatie al digitaal beschikbaar is?'
      when 'erp_afas_change' then 'Welke informatie moet rond jullie ERP/AFAS-verandering nog handmatig worden overgezet, gecontroleerd of nagejaagd?'
      when 'turnaround' then 'Waar gaat nu het meeste tijd of stuurkracht verloren doordat informatie, afspraken of besluiten versnipperd zijn?'
      else 'Welke terugkerende taak of beslissing kost nu onnodig veel handwerk doordat informatie verspreid staat of niet direct beschikbaar is?'
    end||chr(10)||chr(10)||
    'Als je antwoordt, stuur ik je twee concrete observaties terug met mijn redenering. Geen afspraak nodig; je kunt daarna zelf bepalen of er iets in zit.'||
    chr(10)||chr(10)||'Groet,'||chr(10)||'Arthur'||chr(10)||'Bedrijfsgeheugen.nl'||chr(10)||chr(10)||
    'PS Als dit nu niet relevant is, laat het gerust weten; dan stuur ik je hierover niet opnieuw.',
    coalesce(r.trigger_evidence_ref,''),'prepared',v_now,0,r.person_name,r.company_name,r.role
  from ranked r cross join budget b
  where r.rn<=b.slots
  on conflict(dedupe_key) do nothing;

  get diagnostics v_inserted=row_count;

  return jsonb_build_object(
    'contract','powerhouse-autonomous-relationship-outreach-v2',
    'copy_contract','specific-context-value-question-v2',
    'prepared',v_inserted,
    'daily_cap',5,
    'cooldown_days',30,
    'linkedin_context_cooldown_hours',24,
    'channel','email',
    'user_authorized',true,
    'run_date',p_run_date,
    'executed_at',v_now
  );
end;
$function$;
