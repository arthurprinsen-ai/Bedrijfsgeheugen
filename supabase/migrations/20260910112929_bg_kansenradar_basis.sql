alter table public.bg_externe_signalen add column if not exists ruis_reden text, add column if not exists gebruikt_post_notion_id text, add column if not exists gebruikt_dm_op timestamptz;
alter table public.bg_signaal_onderwerpen add column if not exists segmenten text[] not null default '{}', add column if not exists contentpijler text;
update public.bg_signaal_onderwerpen set segmenten=v.s, contentpijler=v.p from (values
 ('AI Act en mkb', array['Directeur / eigenaar','Recruitment & HR','IT & data'], 'AI'),
 ('Kennisverlies en personeel', array['Directeur / eigenaar','Recruitment & HR'], 'Kennisverlies'),
 ('Bedrijfsoverdracht', array['Overdracht & M&A','Accountant & fiscaal','Investeerder','Directeur / eigenaar'], 'Kennisverlies'),
 ('AFAS', array['IT & data','Directeur / eigenaar','Accountant & fiscaal'], 'Koppelingen & API''s'),
 ('Exact en boekhouding', array['Accountant & fiscaal','Directeur / eigenaar'], 'Boekhoudsoftware & Koppelingen'),
 ('Digitalisering mkb', array['Directeur / eigenaar'], 'Automatisering')
) v(o,s,p) where onderwerp=v.o;

select public.brain_register_ai_use_case('canonical','supabase-bg-kansenradar-v1','BG Kansenradar — inhaak-DM (Supabase)','Anthropic','claude-sonnet-5',null,
 'Korte LinkedIn-DM-tekst per segment die inhaakt op een actueel extern signaal (Tavily, vertrouwen >= 0,6), voor het dagoverzicht',
 'kansenradar','LIMITED','Schrijft alleen concepten in powerhouse_sales_actions (status suggested); versturen doet Arthur zelf. Alleen feiten uit de bron, geen verzonnen ervaringen; bron-URL wordt meegeleverd.',
 array['business_context','content_context','public_news'], array['secrets','raw_private_payloads','raw_dm_bodies','personal_contact_data'],
 'Alleen de concepttekst en de bron-URL; geen persoonsgegevens naar het model (alleen segment en voornaam wordt lokaal ingevoegd).', true, true,
 array['supabase:function:bg-kansenradar','decision:arthur-2026-09-10-contextuele-marketing']);
update public.brain_ai_governance_registry set lifecycle_status='ACTIVE', approved=true, approval_evidence_ids=array['DECISION-20260910-ARTHUR-KANSEN-TAVILY-DATAFORSEO'],
 inference_platform='Anthropic API', training_use='NO', processing_scope='GLOBAL', cross_border_transfer='POSSIBLE_OUTSIDE_EEA', subprocessors=array['Anthropic'],
 transfer_safeguard='Anthropic Commercial Terms + DPA met SCCs; geen training op API-invoer', last_reviewed_at=now(), next_review_at=now()+interval '30 days'
where tenant_id='canonical' and use_case_id='supabase-bg-kansenradar-v1';