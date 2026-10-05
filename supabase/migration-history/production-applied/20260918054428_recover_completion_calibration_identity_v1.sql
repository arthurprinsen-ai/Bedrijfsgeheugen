-- Recover Powerhouse Completion Layer v1 forecast-calibration identity.
-- Root cause: #2000 introduced a second uppercase obligation identity even though
-- powerhouse_sync_forecast_calibration_obligation() already owns the canonical
-- lowercase forecast-calibration:<forecast_id> identity.

drop trigger if exists powerhouse_forecast_calibration_obligation_v1
on public.powerhouse_forecasts;

drop function if exists public.powerhouse_enqueue_forecast_calibration_v1();

-- Reassert the existing canonical obligation rows before removing duplicates.
select public.powerhouse_refresh_forecast_calibration_obligations();

-- Remove only the duplicate uppercase obligations when a canonical lowercase
-- obligation for the same forecast exists. This preserves evidence and never
-- deletes an unmatched obligation.
delete from public.revenue_learning_obligations duplicate_row
where duplicate_row.tenant_id = 'canonical'
  and duplicate_row.type = 'FORECAST_CALIBRATION'
  and duplicate_row.status = 'OPEN'
  and duplicate_row.obligation_id like 'FORECAST_CALIBRATION:%'
  and exists (
    select 1
    from public.revenue_learning_obligations canonical_row
    where canonical_row.tenant_id = duplicate_row.tenant_id
      and canonical_row.type = duplicate_row.type
      and canonical_row.status = 'OPEN'
      and canonical_row.payload->>'forecast_id' = duplicate_row.payload->>'forecast_id'
      and canonical_row.obligation_id = 'forecast-calibration:' || (duplicate_row.payload->>'forecast_id')
  );

-- Structural prevention: one forecast may have at most one open calibration
-- obligation regardless of producer naming/casing.
create unique index if not exists revenue_learning_obligations_one_open_forecast_calibration_v1
on public.revenue_learning_obligations(
  tenant_id,
  ((payload->>'forecast_id'))
)
where type = 'FORECAST_CALIBRATION'
  and status = 'OPEN'
  and payload ? 'forecast_id';

select public.powerhouse_capture_completion_evidence_v1();
