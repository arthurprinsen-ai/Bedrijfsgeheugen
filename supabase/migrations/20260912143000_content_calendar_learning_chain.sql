create or replace function public.sync_social_post_content_chain()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_experiment public.social_experiments%rowtype;
  v_recipe jsonb;
  v_date date;
begin
  if new.published_at is null then
    return new;
  end if;

  v_date := (new.published_at at time zone 'Europe/Amsterdam')::date;

  select * into v_experiment
  from public.social_experiments
  where tenant_id = new.tenant_id
    and calendar_date = v_date
  order by updated_at desc nulls last, started_at desc nulls last
  limit 1;

  if not found then
    return new;
  end if;

  v_recipe := case
    when lower(coalesce(new.platform,'')) = 'instagram' then coalesce(v_experiment.recipe->'company', '{}'::jsonb)
    when lower(coalesce(new.platform,'')) = 'linkedin' then coalesce(v_experiment.recipe->'personal', v_experiment.recipe->'company', '{}'::jsonb)
    when lower(coalesce(new.platform,'')) = 'blog' then coalesce(v_experiment.recipe->'blog', '{}'::jsonb)
    else coalesce(v_experiment.recipe->'company', '{}'::jsonb)
  end;

  new.source_campaign_id := coalesce(new.source_campaign_id, v_experiment.experiment_id);
  new.format := coalesce(new.format, nullif(v_recipe->>'format',''), nullif(v_recipe->'formats'->>0,''));
  new.hook_type := coalesce(new.hook_type, nullif(v_recipe->>'hookType',''), nullif(v_recipe->>'textType',''), nullif(v_recipe->>'text_type',''));
  new.narrative_type := coalesce(new.narrative_type, nullif(v_recipe->>'narrativeType',''), nullif(v_recipe->>'textType',''), nullif(v_recipe->>'text_type',''));
  new.emotion := coalesce(new.emotion, nullif(v_recipe->>'emotion',''));
  new.cta_type := coalesce(new.cta_type, nullif(v_recipe->>'ctaType',''), nullif(v_recipe->>'cta_type',''));
  new.topic := coalesce(new.topic, nullif(v_recipe->>'topic',''), nullif(v_experiment.comparison_scope->>'family',''));

  insert into public.bg_post_kenmerken(
    post_key, hook_type, format, narrative_type, emotion, cta_type, topic, bron,
    pain_trigger, fomo_trigger, comedy_device, proof_type, offer_type, source_signal,
    commercial_hypothesis, experiment_id, objective, awareness_stage, behavioral_lever,
    category_entry_point, mental_availability_cue, bijgewerkt_op
  ) values (
    new.post_id,
    new.hook_type,
    new.format,
    new.narrative_type,
    new.emotion,
    new.cta_type,
    new.topic,
    'content-calendar-learning-chain',
    nullif(coalesce(v_recipe->>'painTrigger',v_recipe->>'pain_trigger'),''),
    nullif(coalesce(v_recipe->>'fomoTrigger',v_recipe->>'fomo_trigger'),''),
    nullif(coalesce(v_recipe->>'comedyDevice',v_recipe->>'comedy_device'),''),
    nullif(coalesce(v_recipe->>'proofType',v_recipe->>'proof_type'),''),
    nullif(coalesce(v_recipe->>'offerType',v_recipe->>'offer_type'),''),
    nullif(v_experiment.source_signals->>0,''),
    v_experiment.commercial_hypothesis,
    v_experiment.experiment_id,
    nullif(v_recipe->>'objective',''),
    nullif(coalesce(v_recipe->>'awarenessStage',v_recipe->>'awareness_stage'),''),
    nullif(coalesce(v_recipe->>'behavioralLever',v_recipe->>'behavioral_lever'),''),
    nullif(coalesce(v_recipe->>'categoryEntryPoint',v_recipe->>'category_entry_point'),''),
    nullif(coalesce(v_recipe->>'mentalAvailabilityCue',v_recipe->>'mental_availability_cue'),''),
    now()
  )
  on conflict (post_key) do update set
    hook_type = excluded.hook_type,
    format = excluded.format,
    narrative_type = excluded.narrative_type,
    emotion = excluded.emotion,
    cta_type = excluded.cta_type,
    topic = excluded.topic,
    bron = excluded.bron,
    pain_trigger = excluded.pain_trigger,
    fomo_trigger = excluded.fomo_trigger,
    comedy_device = excluded.comedy_device,
    proof_type = excluded.proof_type,
    offer_type = excluded.offer_type,
    source_signal = excluded.source_signal,
    commercial_hypothesis = excluded.commercial_hypothesis,
    experiment_id = excluded.experiment_id,
    objective = excluded.objective,
    awareness_stage = excluded.awareness_stage,
    behavioral_lever = excluded.behavioral_lever,
    category_entry_point = excluded.category_entry_point,
    mental_availability_cue = excluded.mental_availability_cue,
    bijgewerkt_op = now();

  return new;
end;
$$;

revoke all on function public.sync_social_post_content_chain() from public;

drop trigger if exists social_posts_content_chain on public.social_posts;
create trigger social_posts_content_chain
before insert or update of published_at, platform, source_campaign_id, format, hook_type, narrative_type, emotion, cta_type, topic
on public.social_posts
for each row
execute function public.sync_social_post_content_chain();

-- Idempotent backfill for already observed posts that have a matching calendar slot.
update public.social_posts
set updated_at = now()
where published_at is not null
  and exists (
    select 1
    from public.social_experiments e
    where e.tenant_id = social_posts.tenant_id
      and e.calendar_date = (social_posts.published_at at time zone 'Europe/Amsterdam')::date
  );
