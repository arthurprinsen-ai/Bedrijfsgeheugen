insert into public.powerhouse_evidence_sources
  (source_key,source_class,required,max_age,writer_contract,owner_component,notes,updated_at)
values
  ('regulatory-eu-ai-act','regulatory_authority',true,interval '48 hours','powerhouse_record_source_observation_v1','regulatory-source-watch','EUR-Lex EU AI Act source observations; raw bytes preserved gzip+base64.',now()),
  ('regulatory-eu-nis2-directive','regulatory_authority',true,interval '48 hours','powerhouse_record_source_observation_v1','regulatory-source-watch','EUR-Lex NIS2 source observations; raw bytes preserved gzip+base64.',now()),
  ('regulatory-nl-cyberbeveiligingswet','regulatory_authority',true,interval '48 hours','powerhouse_record_source_observation_v1','regulatory-source-watch','NCSC Cyberbeveiligingswet source observations; raw bytes preserved gzip+base64.',now()),
  ('regulatory-eu-gdpr','regulatory_authority',true,interval '96 hours','powerhouse_record_source_observation_v1','regulatory-source-watch','EUR-Lex GDPR source observations; raw bytes preserved gzip+base64.',now())
on conflict (source_key) do update set
  source_class=excluded.source_class,required=excluded.required,max_age=excluded.max_age,
  writer_contract=excluded.writer_contract,owner_component=excluded.owner_component,
  notes=excluded.notes,updated_at=now();
