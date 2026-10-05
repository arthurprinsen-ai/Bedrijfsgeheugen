do $$
declare
  v_result jsonb;
begin
  v_result := public.powerhouse_autonomous_growth_revenue_cycle((now() at time zone 'Europe/Amsterdam')::date);
  if not coalesce((v_result->>'healthy')::boolean,false) then
    raise exception 'powerhouse autonomous growth/revenue bootstrap unhealthy: %', v_result;
  end if;
end
$$;
