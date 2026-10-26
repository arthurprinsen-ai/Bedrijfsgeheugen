# P0 4198 — Instagram migration SQL terminator correction

The protected media lineage patch #4312 passed its required checks but could not be applied to Supabase: the dollar-quoted `CREATE OR REPLACE FUNCTION` in the SQL migration lacked a semicolon after the closing `$function$`. The following `REVOKE` failed with SQLSTATE 42601.

Change: add the missing terminator only. Keep explicit `REVOKE` from `PUBLIC`, `anon`, `authenticated`; grant to `service_role` only. No identity, media frame, provider idempotency, global uniqueness, production result or OAuth policy is relaxed.

Verification: protected CI; apply corrected migration and inspect function source + permissions; invoke the existing media ensure under the existing authority; verify current OpenArt in-flight video manifest is byte/JSON-stable and still unverified until true Mira frame/temporal proof. Parent issue #4198 must remain open until all four channels are independently proven.

Canonical regression: `tests/brain-publication-resilience-media-and-delivery-p0-4198.test.mjs`.
