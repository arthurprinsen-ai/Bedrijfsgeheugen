-- Media proof evidence security hardening v1
-- Browser/client roles never receive table privileges. Fresh previews may not contain
-- the production-only proof table yet; secure it when present without fabricating it.
do $security$
begin
  if to_regclass('public.powerhouse_media_proof_evidence_v1') is not null then
    execute 'revoke all on table public.powerhouse_media_proof_evidence_v1 from anon, authenticated';
    execute 'grant all on table public.powerhouse_media_proof_evidence_v1 to service_role';
    execute $$comment on table public.powerhouse_media_proof_evidence_v1 is
      'Canonical immutable media-proof evidence. Direct table access is service-role only; browser/client roles have no table privileges. RLS remains enabled as defense in depth.'$$;
  end if;
end
$security$;
