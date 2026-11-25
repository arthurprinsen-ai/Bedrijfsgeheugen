insert into public.bg_schrijfregels
(regel_id,onderwerp,regel,onderbouwing,bewijs_n,vertrouwen,status,bron,bijgewerkt_op)
values
('personal-linkedin-dream-builder-v1','Persoonlijk LinkedIn — mijn droom bouwen',
'Arthur persoonlijk LinkedIn vertelt structureel het echte bouwverhaal van zijn droom: een AI-native bedrijf bouwen dat concrete problemen van bedrijven oplost. Iedere builder-post maakt in gewone mensentaal voelbaar wat ik wil bouwen en waarom, welk herkenbaar bedrijfsprobleem ik probeer op te lossen, wat er echt gebeurde of misging, wat ik veranderde of leerde, wat AI daardoor concreet beter kan en waar ik in geloof over hoe bedrijven en AI straks samenwerken. Geen technische interne statusrapportage en geen verzonnen ervaring.',
'Expliciete gebruikersinstructie 2026-10-07.',1,1.0,'actief','user_instruction+canonical-content-policy',now()),
('public-content-human-language-v1','Publieke content — mensentaal',
'Alle publieke content is begrijpelijk voor ondernemers en managers zonder technische AI-kennis. Interne systeemtaal, architectuurjargon, functienamen, job- of eventnamen, foutcodes, snake_case statussen, database-, pipeline-, deploy-, provider- en readback-termen horen niet in posts. Vertaal techniek altijd naar doel, bedrijfsprobleem, echte frictie, verandering, concreet effect en betekenis voor bedrijven.',
'Expliciete gebruikerscorrectie 2026-10-07.',1,1.0,'actief','user_instruction+canonical-content-policy',now())
on conflict (regel_id) do update set
onderwerp=excluded.onderwerp,regel=excluded.regel,onderbouwing=excluded.onderbouwing,bewijs_n=excluded.bewijs_n,vertrouwen=excluded.vertrouwen,status=excluded.status,bron=excluded.bron,bijgewerkt_op=excluded.bijgewerkt_op;

update public.bg_schrijfregels
set regel='Arthur persoonlijk LinkedIn volgt primair het AI-native builder-verhaal: ik bouw mijn droom om echte problemen van bedrijven op te lossen. Gebruik echte bouwgebeurtenissen, mislukkingen, verrassingen en lessen. Maak steeds de menselijke vertaling naar het concrete bedrijfsprobleem, wat AI daardoor beter kan en Arthurs overtuiging over hoe AI straks echt moet meewerken. Schrijf in gewone taal; geen interne systeem- of architectuurtaal en geen productpitch.',
onderbouwing='Supersedes personal-life-only als standaardlijn op expliciete gebruikersinstructie 2026-10-07.',
bewijs_n=1,vertrouwen=1.0,status='actief',bron='arthur-personal-linkedin-builder-policy',bijgewerkt_op=now()
where regel_id='rci-personal-standup';

update public.brain_records
set result=coalesce(result,'{}'::jsonb)||jsonb_build_object(
'personal_content_mode','AI_NATIVE_DREAM_BUILDER',
'builder_policy','personal-linkedin-ai-native-builder-v1',
'human_language_policy','public-content-human-language-v1',
'business_exception_scope','verified_ai_native_builder_story',
'personal_life_only_runtime','LEGACY_FALLBACK_ONLY'),
updated_at=now()
where tenant_id='canonical' and record_id='arthur-personal-linkedin-identity-v4';
