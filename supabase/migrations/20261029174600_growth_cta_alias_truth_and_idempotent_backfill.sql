-- Preserve the existing ONE BRAIN/Powerhouse writer, no additional scheduler.
-- CTA aggregation previously ignored the event types actually emitted by the website.
CREATE OR REPLACE FUNCTION public.bg_growth_ingest_event(p_event jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_event_id text := nullif(trim(p_event->>'event_id'),'');
  v_event_type text := nullif(trim(p_event->>'event_type'),'');
  v_canonical text := nullif(trim(p_event->>'canonical'),'');
  v_intent_owner text := coalesce(nullif(trim(p_event->>'intent_owner'),''),'');
  v_occurred timestamptz := coalesce(nullif(p_event->>'occurred_at','')::timestamptz, now());
  v_inserted integer := 0;
  v_fingerprint text;
  v_robot boolean := false;
  v_tempo integer := 0;
begin
  if v_event_id is null or v_event_type is null then raise exception 'INVALID_GROWTH_EVENT'; end if;
  if v_canonical is not null and not (v_canonical='https://www.bedrijfsgeheugen.nl/' or v_canonical like 'https://www.bedrijfsgeheugen.nl/%') then raise exception 'INVALID_CANONICAL'; end if;

  -- Tempotoets: meer dan 30 weergaven in de voorafgaande minuut is geen menselijk bezoek
  if v_event_type = 'page_view' then
    select count(*) into v_tempo from public.growth_events
    where event_type = 'page_view'
      and occurred_at > v_occurred - interval '1 minute'
      and occurred_at <= v_occurred;
    v_robot := v_tempo > 30;
  end if;

  v_fingerprint := coalesce(nullif(p_event->>'fingerprint',''),'growth-event|'||v_event_id);

  insert into public.growth_events(event_id,event_type,canonical,intent,intent_owner,attribution_root_key,source,medium,campaign,occurred_at,page_role,funnel_stage,value,payload,is_robot)
  values(v_event_id,v_event_type,v_canonical,nullif(p_event->>'intent',''),nullif(p_event->>'intent_owner',''),nullif(p_event->>'attribution_root_key',''),nullif(p_event->>'source',''),nullif(p_event->>'medium',''),nullif(p_event->>'campaign',''),v_occurred,nullif(p_event->>'page_role',''),nullif(p_event->>'funnel_stage',''),coalesce((p_event->>'value')::numeric,0),coalesce(p_event->'payload','{}'::jsonb),v_robot)
  on conflict(event_id) do nothing;
  get diagnostics v_inserted = row_count;

  insert into public.growth_brain_queue(queue_id,kind,source_id,fingerprint,state,last_error)
  values('event:'||v_event_id,'event',v_event_id,v_fingerprint,
         case when v_robot then 'BLOCKED' else 'QUEUED' end,
         case when v_robot then 'robotverkeer' else null end)
  on conflict(kind,source_id) do nothing;

  if v_inserted=1 and v_canonical is not null and not v_robot then
    insert into public.growth_page_daily(day,canonical,intent_owner,page_views,cta_clicks)
    values(v_occurred::date,v_canonical,v_intent_owner,case when v_event_type='page_view' then 1 else 0 end,case when v_event_type in ('cta_click','primary_cta_click','secondary_cta_click','money_link_click','selfscan_start','frisse_blik_click') then 1 else 0 end)
    on conflict(day,canonical,intent_owner) do update set
      page_views=public.growth_page_daily.page_views+excluded.page_views,
      cta_clicks=public.growth_page_daily.cta_clicks+excluded.cta_clicks,
      updated_at=now();
  end if;

  return jsonb_build_object('stored',v_inserted=1,'deduped',v_inserted=0,'robot',v_robot,'event_id',v_event_id,'queue_id','event:'||v_event_id);
end;
$function$
;

-- Match the current protected production ACL: no browser role executes this SECURITY DEFINER RPC.
-- Observed before change: anon=false; authenticated=false; service_role=true.
REVOKE EXECUTE ON FUNCTION public.bg_growth_ingest_event(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bg_growth_ingest_event(jsonb) TO service_role;

-- Conservative, idempotent reconciliation of observed first-party (non-robot) CTA events.
-- Never interpret unprocessed queue receipts or synthetic/test outcomes as conversions.
WITH observed AS (
  SELECT occurred_at::date AS day, canonical, coalesce(intent_owner,'') AS intent_owner,
         count(DISTINCT event_id)::bigint AS cta_clicks
  FROM public.growth_events
  WHERE event_type IN (
    'cta_click','primary_cta_click','secondary_cta_click','money_link_click',
    'selfscan_start','frisse_blik_click'
  )
    AND is_robot IS FALSE
    AND canonical LIKE 'https://www.bedrijfsgeheugen.nl/%'
  GROUP BY 1,2,3
)
INSERT INTO public.growth_page_daily
  (day,canonical,intent_owner,page_views,cta_clicks)
SELECT day,canonical,intent_owner,0,cta_clicks FROM observed
ON CONFLICT (day,canonical,intent_owner)
DO UPDATE SET cta_clicks=GREATEST(public.growth_page_daily.cta_clicks,EXCLUDED.cta_clicks),
              updated_at=now();
