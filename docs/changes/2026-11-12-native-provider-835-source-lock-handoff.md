# Original Supabase provider 835 → Git source-lock handoff

2026-11-12. Original P0: #4198, related Portal P0 #4215. One source-lock owner, not a new executor.

## Verified production facts
Original PR #5681 merged to main 6f5300cb52f64057e26d025ad52a39cf43301cdf, creating executable migration `20261112211000_original_skipped_provider_reference_readback_handoff_v1.sql`. Native Supabase production `supabase_migrations.schema_migrations` reports **835** applied migrations, newest version/name `20261112211000/original_skipped_provider_reference_readback_handoff_v1`; the original main Git `supabase/migration-history.lock.json` still held **834**, latest `20261112203000`. Exact-head Portal PR #5674 Required run #43290454501 failed closed at migration lock parity. The failure is downstream provider/source ACK drift, not proof of portal field-code failure.

## Controlled correction
Append only exact provider 835 version/name to original Git source lock. Preserve the original first 834 identities, existing SQL and all security/authorization. Historical 835 prefix test checks immutable positions but permits genuinely new later provider-applied migrations; complete source/native parity remains independently enforced by existing protected CI. Reuse existing one-loop source-lock writer/Brain consumer, no new cron/DDL replay/provider connector/secret, no bypass.

## Acceptance
Exact candidate Required, CodeQL, BRAIN, provider-preview as applicable, protected merge; independently compare main lock vs native 835 identities and executable SQL. Re-run original Portal #5674 and Trust #5678 on newly protected main, verify Netlify SHA and real customer+ONE BRAIN+Heartbeat processed readback. This change does not itself prove conversion or publication.
