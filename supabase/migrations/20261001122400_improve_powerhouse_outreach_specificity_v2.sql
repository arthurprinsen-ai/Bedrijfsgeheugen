create or replace function public.powerhouse_optimize_prepared_outreach_v1(
  p_run_date date default ((now() at time zone 'Europe/Amsterdam')::date)
) returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog','public'
as $function$
declare
  v_now timestamptz:=now();
  v_email integer:=0;
  v_linkedin integer:=0;
begin
  update public.powerhouse_sales_actions a
  set evidence=coalesce(a.evidence,'{}'::jsonb)||jsonb_build_object(
        'persuasion_contract','powerhouse-persuasion-revenue-optimizer-v2',
        'persuasion_strategy',p.persuasion_strategy,
        'give_asset',p.give_asset,
        'get_ask',p.get_ask,
        'copy_contract','specific-context-value-question-v2',
        'optimization_rule','context + concrete value + concrete question in first message; never promise a question later',
        'truth_boundary','Use only stored company/relationship/trigger evidence. Never fabricate urgency, proof, impact or company facts.'
      ),
      message_draft=
        'Hoi '||coalesce(nullif(split_part(trim(a.person_name),' ',1),''),'daar')||','||chr(10)||chr(10)||
        case coalesce(a.evidence->>'play_key','')
          when 'anti-consultancy-challenge' then
            'Vanuit Bedrijfsgeheugen kijk ik waar kennis, processen en AI onnodig handwerk of afhankelijkheid veroorzaken. Voor '||
            coalesce(nullif(a.company_name,''),'jullie organisatie')||
            ' stuur ik liever eerst iets bruikbaars dan een verkooppraat.'||chr(10)||chr(10)||
            'Mijn eerste vraag: '||
            case coalesce(a.evidence->>'trigger_type','')
              when 'ai_data_digitalisation' then 'welke terugkerende taak kost jullie nu het meeste handmatige werk terwijl de benodigde informatie al digitaal beschikbaar is?'
              when 'erp_afas_change' then 'welke informatie moet rond jullie ERP/AFAS-verandering nog handmatig worden overgezet, gecontroleerd of nagejaagd?'
              when 'turnaround' then 'waar gaat nu het meeste tijd of stuurkracht verloren doordat informatie, afspraken of besluiten versnipperd zijn?'
              else 'welke terugkerende taak of beslissing kost nu onnodig veel handwerk omdat informatie verspreid staat of niet direct beschikbaar is?'
            end||chr(10)||chr(10)||
            'Op basis van je antwoord kan ik je drie concrete observaties terugsturen. Als daar geen serieuze hefboom uit komt, is mijn advies juist om niets te kopen.'
          when 'risk-reversal' then
            'Vanuit Bedrijfsgeheugen help ik MKB-organisaties om kennis, processen en AI-kansen concreet te maken. Voor '||
            coalesce(nullif(a.company_name,''),'jullie organisatie')||
            ' wil ik het aankooprisico bewust klein houden.'||chr(10)||chr(10)||
            'Mijn eerste vraag: '||
            case coalesce(a.evidence->>'trigger_type','')
              when 'ai_data_digitalisation' then 'welke terugkerende taak kost jullie nu het meeste handmatige werk terwijl de benodigde informatie al digitaal beschikbaar is?'
              when 'erp_afas_change' then 'welke informatie moet rond jullie ERP/AFAS-verandering nog handmatig worden overgezet, gecontroleerd of nagejaagd?'
              when 'turnaround' then 'waar gaat nu het meeste tijd of stuurkracht verloren doordat informatie, afspraken of besluiten versnipperd zijn?'
              else 'waar zit volgens jou nu de grootste frictie tussen hoe het werk bedoeld is en hoe het in de praktijk gebeurt?'
            end||chr(10)||chr(10)||
            'Als daar geen concrete hefboom uit komt, is een betaald vervolg niet nodig.'
          else
            case p.persuasion_strategy
              when 'loss_aversion' then
                'Vanuit Bedrijfsgeheugen kijk ik waar kennis, processen en AI onnodig risico of handwerk veroorzaken. Ik zag een actueel signaal rond '||
                replace(coalesce(a.evidence->>'trigger_type','een relevante ontwikkeling'),'_',' ')||
                ' bij '||coalesce(nullif(a.company_name,''),'jullie organisatie')||'.'
              when 'authority_evidence' then
                'Vanuit Bedrijfsgeheugen kijk ik naar concrete patronen in kennis, processen, data en AI. Ik zag een publiek signaal rond '||
                replace(coalesce(a.evidence->>'trigger_type','een relevante ontwikkeling'),'_',' ')||
                ' bij '||coalesce(nullif(a.company_name,''),'jullie organisatie')||
                ' en heb dat naast die patronen gelegd.'
              when 'commitment_microstep' then
                'Vanuit Bedrijfsgeheugen help ik MKB-organisaties om handmatig werk, versnipperde kennis en AI-kansen concreet te maken. Ik zag een actueel signaal rond '||
                replace(coalesce(a.evidence->>'trigger_type','een relevante ontwikkeling'),'_',' ')||
                ' bij '||coalesce(nullif(a.company_name,''),'jullie organisatie')||'.'
              when 'curiosity_gap' then
                'Ik zag bij '||coalesce(nullif(a.company_name,''),'jullie organisatie')||
                ' een actueel signaal rond '||
                replace(coalesce(a.evidence->>'trigger_type','een relevante ontwikkeling'),'_',' ')||
                '. Vanuit Bedrijfsgeheugen kijk ik dan vooral naar wat dit concreet betekent voor handwerk, kennis en besluitvorming.'
              when 'contrast_before_after' then
                'Vanuit Bedrijfsgeheugen kijk ik hoe kennis, processen en stuurinformatie nu lopen en wat er verandert als je dat slimmer organiseert. Bij '||
                coalesce(nullif(a.company_name,''),'jullie organisatie')||
                ' zag ik een actueel signaal rond '||
                replace(coalesce(a.evidence->>'trigger_type','een relevante ontwikkeling'),'_',' ')||'.'
              when 'reverse_sell' then
                'Ik zag een actueel signaal rond '||
                replace(coalesce(a.evidence->>'trigger_type','een relevante ontwikkeling'),'_',' ')||
                ' bij '||coalesce(nullif(a.company_name,''),'jullie organisatie')||
                '. Ik zou daar op basis van alleen dat signaal nog niets voor kopen.'
              else
                'Vanuit Bedrijfsgeheugen help ik MKB-organisaties om kennis, processen en AI-kansen concreet te maken. Ik zag een actueel signaal rond '||
                replace(coalesce(a.evidence->>'trigger_type','een relevante ontwikkeling'),'_',' ')||
                ' bij '||coalesce(nullif(a.company_name,''),'jullie organisatie')||'.'
            end||chr(10)||chr(10)||
            'Mijn vraag: '||
            case coalesce(a.evidence->>'trigger_type','')
              when 'ai_data_digitalisation' then 'welke terugkerende taak kost jullie nu het meeste handmatige werk terwijl de benodigde informatie al digitaal beschikbaar is?'
              when 'erp_afas_change' then 'welke informatie moet rond jullie ERP/AFAS-verandering nog handmatig worden overgezet, gecontroleerd of nagejaagd?'
              when 'turnaround' then 'waar gaat nu het meeste tijd of stuurkracht verloren doordat informatie, afspraken of besluiten versnipperd zijn?'
              else 'welke terugkerende taak of beslissing kost nu onnodig veel handwerk doordat informatie verspreid staat of niet direct beschikbaar is?'
            end||chr(10)||chr(10)||
            case p.give_asset
              when 'mini_benchmark' then 'Als je daarop antwoordt, leg ik je antwoord langs een korte benchmark en stuur ik terug waar ik de grootste hefboom zie.'
              when 'evidence_teardown' then 'Als je daarop antwoordt, stuur ik je twee concrete observaties terug met bron en redenering.'
              when 'three_levers' then 'Als je daarop antwoordt, stuur ik je drie concrete hefbomen terug die je zelf kunt beoordelen.'
              else 'Als je daarop antwoordt, stuur ik je een korte, concrete terugkoppeling die je zelf kunt beoordelen.'
            end
        end||
        chr(10)||chr(10)||'Groet,'||chr(10)||'Arthur'||chr(10)||'Bedrijfsgeheugen.nl'||chr(10)||chr(10)||
        'PS Als dit nu niet relevant is, laat het gerust weten; dan stuur ik je hierover niet opnieuw.',
      updated_at=v_now
  from public.powerhouse_persuasion_next_best_action_v1 p
  where a.person_key=p.best_person_key
    and a.action_type='autonomous_email'
    and a.channel='email'
    and a.status='prepared'
    and a.due_at<=v_now
    and a.created_at>=v_now-interval '24 hours';

  get diagnostics v_email=row_count;

  update public.powerhouse_sales_actions a
  set evidence=coalesce(a.evidence,'{}'::jsonb)||jsonb_build_object(
        'persuasion_contract','powerhouse-persuasion-revenue-optimizer-v2',
        'persuasion_strategy','reciprocity_value_first',
        'give_asset','useful_public_comment',
        'get_ask','none',
        'optimization_rule','add real value publicly before any private ask',
        'truth_boundary','No sales pitch, fake praise, fabricated fact or appointment CTA in public comments.'
      ),
      updated_at=v_now
  where a.action_type='reply_post'
    and a.channel='linkedin_personal'
    and a.status in ('prepared','suggested')
    and a.created_at>=v_now-interval '24 hours';

  get diagnostics v_linkedin=row_count;

  return jsonb_build_object(
    'contract','powerhouse-persuasion-revenue-optimizer-v2',
    'run_date',p_run_date,
    'email_actions_optimized',v_email,
    'linkedin_actions_tagged',v_linkedin,
    'copy_rule','specific-context-value-question-v2',
    'executed_at',v_now
  );
end;
$function$;
