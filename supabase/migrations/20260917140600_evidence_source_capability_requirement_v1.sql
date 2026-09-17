-- Evidence-source freshness may only be mandatory when a governed ACTIVE provider/owner exists.
-- Do not fabricate heartbeats for unsupported providers just to make full-cycle proof green.

update public.powerhouse_evidence_sources
set required=false,
    notes=case source_key
      when 'finance_revenue' then 'Capability-conditional hard financial source. Not currently backed by an ACTIVE governed provider in POWERHOUSE-RUNTIME-AUTHORITY-v1; absence must not fabricate a heartbeat or block unrelated full-cycle proof. Realized revenue still requires hard financial evidence when claimed.'
      when 'linkedin' then 'Capability-conditional LinkedIn engagement/reply source. Current governed LinkedIn delivery uses Buffer, which is not an engagement/DM readback provider; absence must not fabricate engagement evidence. Human cockpit outcomes remain canonical until a governed engagement provider is activated.'
      when 'calendly' then 'Capability-conditional Calendly source. No persistent ACTIVE Calendly ingest owner is registered in POWERHOUSE-RUNTIME-AUTHORITY-v1; provider readback may be collected on demand, but missing heartbeat must not block unrelated full-cycle proof until an owner is registered.'
      else notes end,
    updated_at=now()
where source_key in ('finance_revenue','linkedin','calendly');

update public.powerhouse_evidence_sources
set required=true,
    notes='Canonical proposal/offers store readback. Freshness is availability/readback evidence only; no proposal or commercial outcome may be fabricated when zero changes occur.',
    updated_at=now()
where source_key='offers';

comment on table public.powerhouse_evidence_sources is 'Evidence-source capability registry. required=true means an ACTIVE governed source owner/provider exists and freshness is mandatory. Unsupported/unowned sources remain registered but required=false; downstream outcome truth gates remain fail-closed and may not be satisfied by synthetic heartbeats.';
