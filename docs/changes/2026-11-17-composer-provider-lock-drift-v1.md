# 17 November 2026 — provider-applied composer migration missing from lock

Parent issue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
Original blocked publication: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5960
Original failing CI: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/44093772404

## Independent diagnosis
Required preflight migration parity failed with `878 !== 879` and specifically `20261117123000_original_composer_bounded_fair_candidate_v2.sql` unaccounted for. Canonical Supabase `supabase_migrations.schema_migrations` independently read back **879 applied migrations**, including exactly version `20261117123000`, name `original_composer_bounded_fair_candidate_v2`, three recorded statements. The repository's last lock snapshot (2026-11-17T10:18:40.655Z) recorded 878 identities and omitted that one migration. The SQL source exists on main and is unchanged.

## Bounded repair
Update ONLY the original `supabase/migration-history.lock.json` from the canonical provider's ordered identities, preserving all previous 878 exact names and versions and adding the one genuine 879th. Refresh the provider-observation capture timestamp. No new SQL execution, migration history write, second writer, lock bypass, or duplicate publisher. Protect via original Required/CodeQL and branch protection. Existing migration integrity tests are the regression gate.

## Acceptance and remaining delivery
Source parity alone must not claim blog delivery: first merge the scoped lock correction after protected gates, then use original existing PR #5960 and its auto-merge/Netlify and public proof, followed by original BRAIN consumer and learning. A preview is not production. The daily social/email/innovation problems in issue #4198 remain separately open.
