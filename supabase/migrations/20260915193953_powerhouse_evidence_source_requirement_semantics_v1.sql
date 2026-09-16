-- Internal evidence writers do not require periodic activity heartbeats.
-- Their completeness remains fail-closed per action/experiment in full-cycle lineage.
update public.powerhouse_evidence_sources
set required=false,
    updated_at=now(),
    notes=case when notes like '%Event-driven internal evidence%' then notes else notes||' Event-driven internal evidence; completeness is enforced conditionally by full-cycle lineage, not by periodic heartbeat.' end
where source_key in ('action_economics','human_feedback','market_outcomes','experiment_assignment');
