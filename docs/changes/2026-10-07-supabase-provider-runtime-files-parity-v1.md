# Supabase provider parity — runtime files versus local metadata

Date: 7 October 2026  
Obligation: `supabase-provider-runtime-files-parity-20261007-v1`

The remaining production-readback failure was not a failed deployment. Supabase had deployed the runtime and the provider check was green, but `supabase-migration-repair-bridge` could never satisfy raw fileset equality: the repository contains `index.ts` and local function metadata `deno.json`, while the Supabase download API returns the deployable runtime source.

The authority now preserves two distinct truths:

- immutable Git source identity continues to hash every repository file, including `deno.json`;
- byte-for-byte provider parity compares only provider-returnable runtime files, excluding `deno.json` metadata on both sides.

This does not weaken provider proof. Runtime source remains byte-compared, convergence remains bounded to 24 attempts with five-second intervals, runtime supersession remains fail-closed, and provider version/runtime hash plus PR writeback remain required.

No Edge Function runtime source, database schema, credentials or branch-protection settings are changed.
