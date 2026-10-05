alter table public.powerhouse_evidence_source_observations
  add constraint powerhouse_evidence_source_observations_evidence_nonempty_check check (evidence <> '{}'::jsonb);

alter table public.powerhouse_evidence_source_observations
  drop constraint powerhouse_evidence_source_observations_source_key_fkey;

alter table public.powerhouse_evidence_source_observations
  add constraint powerhouse_evidence_source_observations_source_key_fkey
  foreign key (source_key) references public.powerhouse_evidence_sources(source_key) on delete restrict;
