-- Keep the calendar as the single source for measurable creative attributes.
-- Fill only missing keys; existing experiment-specific values always win.
update public.social_experiments
set recipe = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(recipe,'{personal,format}',to_jsonb(coalesce(nullif(recipe->'personal'->>'format',''),'text_story')),true),
            '{personal,emotion}',to_jsonb(coalesce(nullif(recipe->'personal'->>'emotion',''),'recognition_then_relief')),true),
          '{personal,ctaType}',to_jsonb(coalesce(nullif(recipe->'personal'->>'ctaType',''),'conversation_question')),true),
        '{personal,painTrigger}',to_jsonb(coalesce(nullif(recipe->'personal'->>'painTrigger',''),'hidden_operational_friction')),true),
      '{personal,fomoTrigger}',to_jsonb(coalesce(nullif(recipe->'personal'->>'fomoTrigger',''),'hidden_cost_of_waiting')),true),
    '{personal,proofType}',to_jsonb(coalesce(nullif(recipe->'personal'->>'proofType',''),'lived_observation')),true),
  '{personal,offerType}',to_jsonb(coalesce(nullif(recipe->'personal'->>'offerType',''),'conversation_to_diagnostic')),true),
  updated_at = now()
where calendar_date is not null;

update public.social_experiments
set recipe = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(recipe,'{company,format}',to_jsonb(coalesce(nullif(recipe->'company'->>'format',''),nullif(recipe->'company'->'formats'->>0,''),'carousel')),true),
            '{company,emotion}',to_jsonb(coalesce(nullif(recipe->'company'->>'emotion',''),'productive_discomfort')),true),
          '{company,ctaType}',to_jsonb(coalesce(nullif(recipe->'company'->>'ctaType',''),'diagnostic_offer')),true),
        '{company,painTrigger}',to_jsonb(coalesce(nullif(recipe->'company'->>'painTrigger',''),'hidden_business_risk')),true),
      '{company,fomoTrigger}',to_jsonb(coalesce(nullif(recipe->'company'->>'fomoTrigger',''),'cost_of_inaction')),true),
    '{company,proofType}',to_jsonb(coalesce(nullif(recipe->'company'->>'proofType',''),'case_or_benchmark')),true),
  '{company,offerType}',to_jsonb(coalesce(nullif(recipe->'company'->>'offerType',''),'frisse_blik_or_scan')),true),
  updated_at = now()
where calendar_date is not null;

update public.social_experiments
set recipe = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(recipe,'{blog,format}',to_jsonb(coalesce(nullif(recipe->'blog'->>'format',''),'seo_article')),true),
          '{blog,emotion}',to_jsonb(coalesce(nullif(recipe->'blog'->>'emotion',''),'productive_discomfort')),true),
        '{blog,ctaType}',to_jsonb(coalesce(nullif(recipe->'blog'->>'ctaType',''),'diagnostic_offer')),true),
      '{blog,painTrigger}',to_jsonb(coalesce(nullif(recipe->'blog'->>'painTrigger',''),'unpriced_problem')),true),
    '{blog,fomoTrigger}',to_jsonb(coalesce(nullif(recipe->'blog'->>'fomoTrigger',''),'competitor_or_cost_of_delay')),true),
  '{blog,proofType}',to_jsonb(coalesce(nullif(recipe->'blog'->>'proofType',''),'benchmark_or_case')),true),
  updated_at = now()
where calendar_date is not null;

-- Re-run existing matching posts through the exact same canonical trigger.
update public.social_posts
set platform = platform,
    updated_at = now()
where published_at is not null
  and exists (
    select 1 from public.social_experiments e
    where e.tenant_id = social_posts.tenant_id
      and e.calendar_date = (social_posts.published_at at time zone 'Europe/Amsterdam')::date
  );
