create or replace function public.enforce_instagram_exact_final_media_gate_v1()
returns trigger
language plpgsql
security definer
set search_path=public,pg_catalog
as $$
begin
  if new.tenant_id='canonical'
     and new.channel='instagram'
     and new.status in ('PUBLISHED','LIVE_PROVEN','MEASURED','LEARNED')
     and not (
       public.powerhouse_jsonb_true(coalesce(new.evidence,'{}'::jsonb),'exact_final_media_proven') is true
       and nullif(coalesce(new.evidence,'{}'::jsonb)->>'final_media_sha256','') is not null
       and coalesce(coalesce(new.evidence,'{}'::jsonb)->>'mira_gate_result','')='PASS'
     ) then
    new.status := 'BLOCKED';
    new.last_error := 'EXACT_FINAL_MEDIA_PROOF_REQUIRED';
    new.next_action := 'Bewijs immutable exact-final-media digest/frames + Mira PASS; transport sent alleen is onvoldoende.';
    new.evidence := coalesce(new.evidence,'{}'::jsonb) || jsonb_build_object(
      'exact_final_media_gate','FAIL_CLOSED',
      'exact_final_media_gate_enforced_at',now(),
      'proof_failure_pattern','provider-transport-readable-but-final-media-bytes-not-retrievable-v1'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_instagram_exact_final_media_gate_v1 on public.content_publication_obligations;
create trigger trg_enforce_instagram_exact_final_media_gate_v1
before insert or update on public.content_publication_obligations
for each row execute function public.enforce_instagram_exact_final_media_gate_v1();
