-- instagram-mira-reel-recommendation-normalization-v1
-- Reel-only v3 supersedes legacy calendar seeds that still request carousel/Placid.
-- Normalize at the canonical recommendation boundary so selector/materializer never see an invalid Mira daily-life format.

create or replace function public.powerhouse_normalize_instagram_mira_reel_recommendation_v1()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  if new.target_channel in ('instagram','instagram_company')
     and lower(coalesce(new.evidence->>'character','')) = 'mira'
     and lower(coalesce(new.evidence->>'character_mode','daily_life')) = 'daily_life'
  then
    new.evidence :=
      (coalesce(new.evidence,'{}'::jsonb) - 'visual_generator')
      || jsonb_build_object(
        'format','reel',
        'production_route','openart_video',
        'reel_generator','OpenArt',
        'policy_normalization','instagram-mira-reel-only-v3',
        'policy_normalized_from',
          case
            when lower(coalesce(new.evidence->>'format','')) <> 'reel'
              or lower(coalesce(new.evidence->>'production_route','')) not like '%openart%'
            then jsonb_build_object(
              'format',new.evidence->>'format',
              'production_route',new.evidence->>'production_route'
            )
            else coalesce(new.evidence->'policy_normalized_from','{}'::jsonb)
          end,
        'policy_normalized_at',
          case
            when lower(coalesce(new.evidence->>'format','')) <> 'reel'
              or lower(coalesce(new.evidence->>'production_route','')) not like '%openart%'
            then to_jsonb(now())
            else coalesce(new.evidence->'policy_normalized_at',to_jsonb(now()))
          end
      );
  end if;
  return new;
end
$$;

drop trigger if exists powerhouse_normalize_instagram_mira_reel_recommendation_v1
on public.powerhouse_content_recommendations;

create trigger powerhouse_normalize_instagram_mira_reel_recommendation_v1
before insert or update on public.powerhouse_content_recommendations
for each row
execute function public.powerhouse_normalize_instagram_mira_reel_recommendation_v1();

update public.powerhouse_content_recommendations
set
  evidence =
    (coalesce(evidence,'{}'::jsonb) - 'visual_generator')
    || jsonb_build_object(
      'format','reel',
      'production_route','openart_video',
      'reel_generator','OpenArt',
      'policy_normalization','instagram-mira-reel-only-v3',
      'policy_normalized_from',jsonb_build_object(
        'format',evidence->>'format',
        'production_route',evidence->>'production_route'
      ),
      'policy_normalized_at',to_jsonb(now())
    ),
  updated_at=now()
where run_date >= date '2026-09-21'
  and target_channel in ('instagram','instagram_company')
  and lower(coalesce(evidence->>'character',''))='mira'
  and lower(coalesce(evidence->>'character_mode','daily_life'))='daily_life'
  and (
    lower(coalesce(evidence->>'format','')) <> 'reel'
    or lower(coalesce(evidence->>'production_route','')) not like '%openart%'
  );

revoke execute on function public.powerhouse_normalize_instagram_mira_reel_recommendation_v1()
from public, anon, authenticated;
grant execute on function public.powerhouse_normalize_instagram_mira_reel_recommendation_v1()
to service_role;
