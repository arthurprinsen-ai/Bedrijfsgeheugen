-- Media proof least privilege v1
-- RLS already fail-closes direct access; remove unnecessary grants so privilege metadata matches runtime intent.

revoke all on table public.powerhouse_media_proof_evidence_v1 from anon, authenticated;
grant select,insert,update,delete,truncate,references,trigger on table public.powerhouse_media_proof_evidence_v1 to service_role;

comment on table public.powerhouse_media_proof_evidence_v1 is
'Internal server-authoritative media proof evidence. Direct anon/authenticated access is denied; service_role owns governed reads and writes.';
