create or replace function public.enforce_instagram_exact_final_media_gate_v1()
returns trigger
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $function$
declare
  v_provider_side_effect boolean;
begin
  if new.tenant_id='canonical'
     and new.channel='instagram'
     and new.status in ('PUBLISHED','LIVE_PROVEN','MEASURED','LEARNED') then

    v_provider_side_effect :=
      nullif(coalesce(new.external_id,''),'') is not null
      and (
        public.powerhouse_jsonb_true(coalesce(new.evidence,'{}'::jsonb),'provider_create_success')
        or public.powerhouse_jsonb_true(coalesce(new.evidence,'{}'::jsonb),'provider_publication_ack_verified')
        or public.powerhouse_jsonb_true(coalesce(new.evidence,'{}'::jsonb),'provider_truth_verified')
        or public.powerhouse_jsonb_true(coalesce(new.evidence,'{}'::jsonb),'terminal_provider_side_effect')
      );

    if not (
      public.powerhouse_jsonb_true(coalesce(new.evidence,'{}'::jsonb),'exact_final_media_proven') is true
      and nullif(coalesce(new.evidence,'{}'::jsonb)->>'final_media_sha256','') is not null
      and coalesce(coalesce(new.evidence,'{}'::jsonb)->>'mira_gate_result','')='PASS'
    ) then
      if v_provider_side_effect then
        new.evidence := coalesce(new.evidence,'{}'::jsonb) || jsonb_build_object(
          'terminal_provider_side_effect',true,
          'republish_forbidden',true,
          'post_publish_exact_media_proof_gap',true,
          'proof_gap_prospective_only',true,
          'terminality_contract','social-provider-write-terminal-v1',
          'exact_final_media_gate_observed_at',now()
        );
        new.last_error := null;
        new.next_action := 'Behandel ontbrekend exact media-proof als prospectieve kwaliteitscontrole voor de volgende claim; deze provider-created publicatie blijft terminal.';
      else
        new.status := 'BLOCKED';
        new.last_error := 'EXACT_FINAL_MEDIA_PROOF_REQUIRED';
        new.next_action := 'Bewijs immutable exact-final-media digest/frames + Mira PASS vóór provider write.';
        new.evidence := coalesce(new.evidence,'{}'::jsonb) || jsonb_build_object(
          'exact_final_media_gate','FAIL_CLOSED',
          'exact_final_media_gate_enforced_at',now(),
          'proof_failure_pattern','provider-transport-readable-but-final-media-bytes-not-retrievable-v1'
        );
      end if;
    end if;
  end if;
  return new;
end;
$function$;

create or replace function public.enforce_instagram_obligation_vision_v1()
returns trigger
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $function$
declare
  v_visual jsonb;
  v_media_type text;
  v_claims_pass boolean;
  v_provider_side_effect boolean;
begin
  if new.tenant_id<>'canonical' or new.channel<>'instagram' then
    return new;
  end if;

  v_visual := coalesce(
    new.evidence->'instagram_visual',
    new.evidence->'instagram_media_proof'->'instagram_visual',
    '{}'::jsonb
  );
  v_media_type := coalesce(
    new.evidence->>'media_type',
    new.evidence->'instagram_media_proof'->>'media_type',
    'image'
  );
  v_claims_pass :=
    coalesce(new.evidence->>'mira_gate_result','')='PASS'
    or coalesce((new.evidence->>'mira_gate_passed')::boolean,false)
    or coalesce((new.evidence->>'exact_final_media_proven')::boolean,false);

  v_provider_side_effect :=
    nullif(coalesce(new.external_id,''),'') is not null
    and (
      public.powerhouse_jsonb_true(coalesce(new.evidence,'{}'::jsonb),'provider_create_success')
      or public.powerhouse_jsonb_true(coalesce(new.evidence,'{}'::jsonb),'provider_publication_ack_verified')
      or public.powerhouse_jsonb_true(coalesce(new.evidence,'{}'::jsonb),'provider_truth_verified')
      or public.powerhouse_jsonb_true(coalesce(new.evidence,'{}'::jsonb),'terminal_provider_side_effect')
    );

  if v_claims_pass and not public.powerhouse_instagram_visual_proof_valid_v1(v_visual,v_media_type) then
    if v_provider_side_effect then
      new.evidence := coalesce(new.evidence,'{}'::jsonb) || jsonb_build_object(
        'terminal_provider_side_effect',true,
        'republish_forbidden',true,
        'post_publish_visual_proof_gap',true,
        'prospective_identity_control_required',true,
        'proof_gap_prospective_only',true,
        'terminality_contract','social-provider-write-terminal-v1',
        'visual_proof_gap_observed_at',now()
      );
      new.last_error := null;
      new.next_action := 'Gebruik vision-proof als prospectieve gate vóór de volgende Instagram provider write; deze bestaande provider-created publicatie blijft terminal.';
    else
      new.evidence := coalesce(new.evidence,'{}'::jsonb) || jsonb_build_object(
        'mira_gate_result','FAIL',
        'mira_gate_passed',false,
        'exact_final_media_proven',false,
        'semantic_visual_proof_required',true,
        'metadata_only_identity_rejected',true
      );
      new.last_error := 'MIRA_VISIBLE_IDENTITY_PROOF_REQUIRED';
      new.next_action := 'Laat de exacte finale media vision-verifiëren vóór provider write; metadata/template/layer bewijs is nooit voldoende.';
      if new.status in ('PUBLISHED','LIVE_PROVEN','MEASURED','LEARNED') then
        new.status := 'BLOCKED';
      end if;
    end if;
  end if;
  return new;
end;
$function$;
