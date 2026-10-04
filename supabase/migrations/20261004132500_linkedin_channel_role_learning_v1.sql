-- Powerhouse channel-role learning v1
-- Root cause: aggregate social learning treated tiny absolute response as a winner and mixed
-- personal/company LinkedIn evidence. Preserve channel identity and normalize weak outcomes.

create or replace function public.bg_content_lessen()
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $function$
declare
  v_n integer; v_reacties numeric; v_impressies numeric; v_geclassificeerd integer; v_geschreven integer:=0;
  v_personal_n integer; v_personal_impr numeric; v_personal_react numeric;
  v_company_n integer; v_company_impr numeric; v_company_react numeric;
begin
  select count(*),coalesce(sum(reacties),0),coalesce(sum(impressies),0),count(*) filter(where hook_type is not null)
  into v_n,v_reacties,v_impressies,v_geclassificeerd
  from public.bg_post_prestatie where impressies>0;

  if v_n>=8 then
    insert into public.bg_schrijfregels(regel_id,onderwerp,regel,onderbouwing,bewijs_n,vertrouwen,status)
    values('slotvraag','Slotvraag',
      case when v_reacties=0 then 'De huidige slotvraag levert geen reacties op. Vraag niet om een mening maar om een concreet voorbeeld uit hun eigen week, en stel de vraag aan één type lezer.'
           when v_impressies>0 and (100.0*v_reacties/v_impressies)<0.10 then 'Slotvragen leveren wel reacties op, maar de respons is zeer laag. Behandel dit niet als winnaar: test concretere, smallere vragen en vergelijk reactie per 1.000 impressies.'
           else 'De slotvraag levert aantoonbaar respons op; behoud de best presterende vraagvorm en blijf tegen alternatieven testen.' end,
      format('%s posts met bereik, samen %s reacties op %s impressies (%s%% reacties per impressie).',v_n,v_reacties,v_impressies,case when v_impressies>0 then round(100.0*v_reacties/v_impressies,3)::text else '0' end),
      v_n,least(0.9,0.4+v_n*0.03),'actief')
    on conflict(regel_id) do update set regel=excluded.regel,onderbouwing=excluded.onderbouwing,bewijs_n=excluded.bewijs_n,vertrouwen=excluded.vertrouwen,status=excluded.status,bijgewerkt_op=now();
    v_geschreven:=v_geschreven+1;
  end if;

  insert into public.bg_schrijfregels(regel_id,onderwerp,regel,onderbouwing,bewijs_n,vertrouwen,status)
  select 'kanaalkeuze','Kanaalkeuze',format('Zet het zwaartepunt op %s: daar staat het gemiddelde bereik op %s per post.',platform,round(avg(impressies))),
    format('%s posts gemeten op dit kanaal.',count(*)),count(*)::int,least(0.85,0.35+count(*)*0.03),case when count(*)>=5 then 'actief' else 'te weinig bewijs' end
  from public.bg_post_prestatie where impressies>0 group by platform order by avg(impressies) desc limit 1
  on conflict(regel_id) do update set regel=excluded.regel,onderbouwing=excluded.onderbouwing,bewijs_n=excluded.bewijs_n,vertrouwen=excluded.vertrouwen,status=excluded.status,bijgewerkt_op=now();
  v_geschreven:=v_geschreven+1;

  if v_geclassificeerd>=6 then
    insert into public.bg_schrijfregels(regel_id,onderwerp,regel,onderbouwing,bewijs_n,vertrouwen,status)
    select 'haaktype','Haaktype',format('Gebruik het haaktype "%s": gemiddeld %s%% interactie tegen %s%% over alle posts.',hook_type,round(avg(interactie_pct),2),(select round(avg(interactie_pct),2) from public.bg_post_prestatie where impressies>0)),
      format('%s posts met dit haaktype.',count(*)),count(*)::int,least(0.85,0.35+count(*)*0.05),case when count(*)>=3 then 'actief' else 'te weinig bewijs' end
    from public.bg_post_prestatie where impressies>0 and hook_type is not null group by hook_type order by avg(interactie_pct) desc nulls last limit 1
    on conflict(regel_id) do update set regel=excluded.regel,onderbouwing=excluded.onderbouwing,bewijs_n=excluded.bewijs_n,vertrouwen=excluded.vertrouwen,status=excluded.status,bijgewerkt_op=now();
    v_geschreven:=v_geschreven+1;
  end if;

  insert into public.bg_schrijfregels(regel_id,onderwerp,regel,onderbouwing,bewijs_n,vertrouwen,status)
  select 'doorklik','Doorklik naar de site',
    case when sum(kliks)=0 then 'Geen enkele gemeten post levert een klik naar de site op. Zet op zakelijke kanalen een meetbare, relevante route naar een concrete volgende stap; persoonlijk LinkedIn blijft vrij van zakelijke CTA''s.'
         when sum(kliks)<greatest(3,count(*)/20.0) then 'Er zijn enkele kliks, maar te weinig bewijs om de huidige verwijsvorm als winnaar te behandelen. Test zakelijke CTA en landingsroute verder op gekwalificeerde bezoeken en orders.'
         else format('Posts leveren kliks op (%s gemeten); behoud de best presterende zakelijke verwijsvorm en optimaliseer verder op leads en omzet.',sum(kliks)) end,
    format('%s posts gemeten, %s kliks in totaal.',count(*),sum(kliks)),count(*)::int,least(0.9,0.4+count(*)*0.03),case when count(*)>=5 then 'actief' else 'te weinig bewijs' end
  from public.bg_post_prestatie where impressies>0
  on conflict(regel_id) do update set regel=excluded.regel,onderbouwing=excluded.onderbouwing,bewijs_n=excluded.bewijs_n,vertrouwen=excluded.vertrouwen,status=excluded.status,bijgewerkt_op=now();
  v_geschreven:=v_geschreven+1;

  select count(*),coalesce(sum(p.impressies),0),coalesce(sum(p.reacties),0)
    into v_personal_n,v_personal_impr,v_personal_react
  from public.bg_post_prestatie p join public.social_posts s on s.post_id=p.post_id
  where p.impressies>0 and s.channel_kind='linkedin_personal';

  select count(*),coalesce(sum(p.impressies),0),coalesce(sum(p.reacties),0)
    into v_company_n,v_company_impr,v_company_react
  from public.bg_post_prestatie p join public.social_posts s on s.post_id=p.post_id
  where p.impressies>0 and s.channel_kind='linkedin_company';

  insert into public.bg_schrijfregels(regel_id,onderwerp,regel,onderbouwing,bewijs_n,vertrouwen,status,bron)
  values('linkedin-channel-role-evidence-v1','LinkedIn kanaalrollen',
    case when v_personal_n>=3 and v_company_n>=3 and v_personal_impr/greatest(v_personal_n,1)>3*(v_company_impr/greatest(v_company_n,1))
         then 'Behandel Arthur persoonlijk en de bedrijfspagina niet als dezelfde contentmachine. Persoonlijk LinkedIn optimaliseert op menselijke herkenning, bereik en echte conversatie zonder zakelijke leadbrug. LinkedIn bedrijf optimaliseert op MKB-probleemherkenning, bewijs, concrete waarde, meetbare vervolgstap en omzet. Cross-posten of dezelfde copy hergebruiken is verboden.'
         else 'Behandel Arthur persoonlijk en de bedrijfspagina als afzonderlijke experimentarmen met eigen doel en copy. Hergebruik geen identieke copy; leer per kanaal op genormaliseerde uitkomsten.' end,
    format('Observed: personal %s posts/%s impressies/%s reacties; company %s posts/%s impressies/%s reacties. Vergelijking gebruikt alleen posts met gemeten impressies en expliciete channel_kind.',v_personal_n,v_personal_impr,v_personal_react,v_company_n,v_company_impr,v_company_react),
    least(v_personal_n,v_company_n),0.95,case when v_personal_n>=3 and v_company_n>=3 then 'actief' else 'te weinig bewijs' end,'metingen+channel_identity')
  on conflict(regel_id) do update set regel=excluded.regel,onderbouwing=excluded.onderbouwing,bewijs_n=excluded.bewijs_n,vertrouwen=excluded.vertrouwen,status=excluded.status,bron=excluded.bron,bijgewerkt_op=now();
  v_geschreven:=v_geschreven+1;

  return jsonb_build_object('regels',v_geschreven,'posts_gemeten',v_n,'posts_geclassificeerd',v_geclassificeerd,'linkedin_personal_posts',v_personal_n,'linkedin_company_posts',v_company_n,'op',now());
end;
$function$;

revoke execute on function public.bg_content_lessen() from public,anon,authenticated;
grant execute on function public.bg_content_lessen() to service_role;
