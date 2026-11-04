# Incident ledger — orig. ONE BRAIN content reconciler SQLSTATE42601

- 2026-11-04 native Supabase Preview on source PR #5381 after safely updating branch to main `909c015ab929dca4d0b5091ad0e346628a306e82`: FAILED SQLSTATE `42601` at `REVOKE`, source migration `20261104052001_original_personal_reconciler_nested_builder_proof_v1.sql`.
- Original upstream: merged PR https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5382, original owner `original-ONE-BRAIN-content-reconciler`; merge did not prove native Supabase production migration.
- Root cause: missing one SQL terminator `;` after `$function$`; the provider parser treated the REVOKE as part of an unterminated function statement.
- Fix: amend same original *not-yet-applied-to-preview* migration file to close the function with `$function$;`; preserve exact content/business/ACL behavior.
- Prevention: extend the existing original BRAIN personal-reconciler test to require proper function terminator preceding original revoked public/anon/authenticated roles and grant solely to service_role.
- Independent proof still required: same original release checks, native preview migration SQLSTATE clear, protected main, source production schema_migrations and ACL, natural runtime, real provider public readback.
- Side effects: no new scheduler, no OAuth/media/Stripe payment, no synthetic published content or altered identity thresholds. Original owner to observe next actual source run and append eventual production receipts.
- Other original incidents and PR #5381 remain independent and open until separately proven.
