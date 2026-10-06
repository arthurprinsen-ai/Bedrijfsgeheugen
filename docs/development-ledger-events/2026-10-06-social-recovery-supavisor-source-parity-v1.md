# Social recovery Supavisor/source-parity closure

Date: 2026-10-06  
Obligation: social-daily-publication-no-gap-transport-20261006

Observed:
- production Supabase project remained ACTIVE_HEALTHY in eu-central-1;
- direct SQL succeeded and reported pg_is_in_recovery=false;
- the incident path had shown PostgREST/Data API HTTP 522 responses;
- live critical Edge Functions had already been repaired to use aws-0-eu-central-1.pooler.supabase.com:6543;
- repository main still contained older PostgREST-based implementations for critical publication functions;
- the GitHub social recovery workflow still fetched scheduler authority and publication state through /rest/v1.

Structural repair:
- reconciled the proven production implementations of content-operations, powerhouse-social-publisher, powerhouse-content-orchestrator and powerhouse-content-loop back into repository source;
- added a source-controlled social-recovery-runner that authenticates the caller with the service-role credential, obtains the scheduler authority through Supavisor, invokes only the canonical powerhouse-content-loop and emits sanitized state;
- removed direct PostgREST/Vault inspection and direct publication-table reads from social-publication-recovery.yml;
- added fail-closed regression coverage requiring the EU Supavisor endpoint and forbidding /rest/v1 in the critical recovery path.

Safety:
- no Vault value is inspected, logged or returned;
- no direct LinkedIn/Instagram provider bypass is introduced;
- content-loop remains the single recovery orchestrator;
- provider-truth verification remains required before publication is treated as terminal.

Release closure requires:
- exact-head CI green;
- protected merge;
- post-merge source/runtime parity readback;
- successful same-day recovery evidence without PostgREST dependency.
