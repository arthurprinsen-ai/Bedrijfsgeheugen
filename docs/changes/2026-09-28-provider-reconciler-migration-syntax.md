# Provider reconciler migration syntax closure

Date: 2026-09-28  
Fingerprint: `provider-reconciler-migration-syntax-closure-v1`

## Root cause

The provider-side-effect reconciliation function had been snapshotted from the live database into a migration. Its dollar-quoted function body ended with `$function$` but the SQL statement terminator `;` was missing before the subsequent `REVOKE` and `GRANT` statements. Runtime behavior was already active because the function had been applied separately, but a clean migration replay could not parse the repository artifact.

## Prevention

All function migrations must be replayable from scratch. A `CREATE OR REPLACE FUNCTION ... AS $function$` block must terminate with `$function$;` before any following statement. SECURITY DEFINER functions must also retain explicit browser-role revocation and service-role execution grants.

Runtime success is not sufficient evidence for repository closure; migration replay is part of the canonical delivery contract.

## Evidence

Canonical file: `supabase/migrations/20260928121500_provider_write_terminal_reconciler_v1.sql`.

The corrected migration has been applied to the live project, and the content supervisor/social publisher were redeployed from the canonical repository state.
