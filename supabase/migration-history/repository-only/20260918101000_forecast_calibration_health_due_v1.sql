-- Forecast calibration health due-semantics v1
-- An event-driven calibration source is healthy while no calibration obligation is overdue.

do $$
declare
  v_def text;
  v_old constant text := $sig$
    ('forecast-calibration',(select max(fc.measured_at) from powerhouse_forecast_calibration fc),interval '48 hours',false),
$sig$;
  v_new constant text := $sig$
    ('forecast-calibration',(
      case
        when not exists (
          select 1
          from revenue_learning_obligations rlo
          where rlo.type='FORECAST_CALIBRATION'
            and rlo.status='OPEN'
            and rlo.due_at<=now()
        ) then now()
        else (select max(fc.measured_at) from powerhouse_forecast_calibration fc)
      end
    ),interval '48 hours',false),
$sig$;
begin
  select pg_get_functiondef('public.bg_gezondheid_meten()'::regprocedure) into v_def;
  if position(v_new in v_def)>0 then
    null;
  elsif position(v_old in v_def)>0 then
    execute replace(v_def,v_old,v_new);
  else
    raise exception 'FORECAST_CALIBRATION_HEALTH_SIGNATURE_NOT_FOUND';
  end if;
end $$;

comment on function public.bg_gezondheid_meten() is
'Canonical health writer. Forecast calibration is due-driven: no overdue calibration obligation means healthy event-driven state; stale calibration evidence becomes relevant once calibration is actually due.';
