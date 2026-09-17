-- Fingerprint: powerhouse-structure-hygiene-v1
-- Replay compatibility baseline: production had these agreement fields before they were captured in migration history.
alter table public.offertes
  add column if not exists akkoord_door uuid,
  add column if not exists akkoord_naam text,
  add column if not exists akkoord_functie text;
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.offertes'::regclass
      and conname = 'offertes_akkoord_door_fkey'
  ) then
    alter table public.offertes
      add constraint offertes_akkoord_door_fkey
      foreign key (akkoord_door) references auth.users(id) on delete set null;
  end if;
end $$;

alter policy eigen_stand_lezen on public.portaal_stand
  using (((gebruiker_id = (select auth.uid())) and (organisatie_id in (select intern.mijn_organisaties()))));
alter policy eigen_stand_maken on public.portaal_stand
  with check (((gebruiker_id = (select auth.uid())) and (organisatie_id in (select intern.mijn_organisaties()))));
alter policy eigen_stand_wijzigen on public.portaal_stand
  using (((gebruiker_id = (select auth.uid())) and (organisatie_id in (select intern.mijn_organisaties()))))
  with check (((gebruiker_id = (select auth.uid())) and (organisatie_id in (select intern.mijn_organisaties()))));
alter policy eigen_stand_wissen on public.portaal_stand
  using (((gebruiker_id = (select auth.uid())) and (organisatie_id in (select intern.mijn_organisaties()))));
create index if not exists lopende_verzoeken_bron_id_idx on intern.lopende_verzoeken (bron_id);
create index if not exists bg_externe_signalen_onderwerp_fk_idx on public.bg_externe_signalen (onderwerp);
create index if not exists blokversies_publicatie_id_fk_idx on public.blokversies (publicatie_id);
create index if not exists brain_ai_governance_incidents_tenant_use_case_fk_idx on public.brain_ai_governance_incidents (tenant_id, use_case_id);
create index if not exists brain_budget_usage_adjusts_usage_id_fk_idx on public.brain_budget_usage (adjusts_usage_id);
create index if not exists brain_failure_occurrences_fingerprint_fk_idx on public.brain_failure_occurrences (fingerprint);
create index if not exists brain_outbox_operation_id_fk_idx on public.brain_outbox (operation_id);
create index if not exists brain_production_truth_desired_state_id_fk_idx on public.brain_production_truth (desired_state_id);
create index if not exists brain_production_truth_observation_id_fk_idx on public.brain_production_truth (observation_id);
create index if not exists brain_reconciliation_jobs_operation_id_fk_idx on public.brain_reconciliation_jobs (operation_id);
create index if not exists cijfervoorstellen_publicatie_id_fk_idx on public.cijfervoorstellen (publicatie_id);
create index if not exists connector_executions_connector_id_fk_idx on public.connector_executions (connector_id);
create index if not exists connector_reviews_connector_id_fk_idx on public.connector_reviews (connector_id);
create index if not exists connector_reviews_execution_id_fk_idx on public.connector_reviews (execution_id);
create index if not exists leden_organisatie_id_fk_idx on public.leden (organisatie_id);
create index if not exists logboek_gebruiker_id_fk_idx on public.logboek (gebruiker_id);
create index if not exists logboek_offerte_id_fk_idx on public.logboek (offerte_id);
create index if not exists offertes_akkoord_door_fk_idx on public.offertes (akkoord_door);
create index if not exists powerhouse_evidence_source_observations_source_key_fk_idx on public.powerhouse_evidence_source_observations (source_key);
create index if not exists powerhouse_experiment_assignments_treatment_action_id_fk_idx on public.powerhouse_experiment_assignments (treatment_action_id);
create index if not exists powerhouse_human_feedback_events_action_id_fk_idx on public.powerhouse_human_feedback_events (action_id);
create index if not exists uitnodigingen_organisatie_id_fk_idx on public.uitnodigingen (organisatie_id);
