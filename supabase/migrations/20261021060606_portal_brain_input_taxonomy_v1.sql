-- P0 #4215: admit exactly the records already emitted by Portal V2.
-- No table data, tenant predicates, RLS, grants, RPCs or writer identity changes.
begin;
set local lock_timeout = '2s';
set local statement_timeout = '20s';

-- Fail before replacement if another migration introduced an unknown taxonomy.
-- Known legacy and governance values remain accepted; arbitrary values do not.
do $$
declare c record; literals text[];
begin
 for c in select conname,pg_get_constraintdef(oid) as definition from pg_constraint
  where conrelid='public.brain_records'::regclass
   and conname in ('brain_records_type_check','brain_records_kind_check')
 loop
  select array_agg(m[1]) into literals from regexp_matches(c.definition,'''([^'']+)''','g') m;
  if c.conname='brain_records_type_check' and not literals <@ array['Evidence','Signal','Opportunity','Impact','Decision','Action','Execution','Verification','Outcome','Value','Learning','Memory','Entity','Relation','CurrentState','Governance','SourceObservation','BusinessInput','ImpactAssessment']::text[] then
   raise exception 'PORTAL_BRAIN_TYPE_TAXONOMY_DRIFT';
  end if;
  if c.conname='brain_records_kind_check' and not literals <@ array['evidence','signal','opportunity','impact','decision','action','execution','verification','outcome','value','learning','memory','entity','relation','current_state','governance','raw_source','SourceTruth','organism_impact']::text[] then
   raise exception 'PORTAL_BRAIN_KIND_TAXONOMY_DRIFT';
  end if;
 end loop;
end $$;

alter table public.brain_records drop constraint brain_records_type_check;
alter table public.brain_records add constraint brain_records_type_check
 check (record_type in ('Evidence','Signal','Opportunity','Impact','Decision','Action','Execution','Verification','Outcome','Value','Learning','Memory','Entity','Relation','CurrentState','Governance','SourceObservation','BusinessInput','ImpactAssessment')) not valid;
alter table public.brain_records drop constraint brain_records_kind_check;
alter table public.brain_records add constraint brain_records_kind_check
 check (record_kind in ('evidence','signal','opportunity','impact','decision','action','execution','verification','outcome','value','learning','memory','entity','relation','current_state','governance','raw_source','SourceTruth','organism_impact')) not valid;
alter table public.brain_records validate constraint brain_records_type_check;
alter table public.brain_records validate constraint brain_records_kind_check;
commit;
