-- Media proof evidence security hardening v1
-- RLS without policies already blocks row access, but anon/auth must not retain broad table privileges.

revoke all on table public.powerhouse_media_proof_evidence_v1 from anon, authenticated;
grant all on table public.powerhouse_media_proof_evidence_v1 to service_role;

comment on table public.powerhouse_media_proof_evidence_v1 is
'Canonical immutable media-proof evidence. Direct table access is service-role only; browser/client roles have no table privileges. RLS remains enabled as defense in depth.';
