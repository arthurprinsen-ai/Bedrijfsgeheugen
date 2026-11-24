# Development ledger — CRO site en social meetprojecties

- Tijd: 17 november 2026, circa 16:27 UTC.
- Verplichting: `CRO_SITE_SOCIAL_DIAGNOSTICS_20261117`.
- Branch: `feat/cro-site-social-diagnostics-20261117`.
- PR: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5964
- Bestaande autoriteit: ONE BRAIN, Powerhouse CRO, Heartbeat, BG169; geen eigen executor of scheduler.
- Aanleiding: sterke botdominantie (33.574/35.173 eventregels), slechts 34 toestemmingsgedekte niet-robot page-events, verschil tussen 151 niet-robot kliks en nul CTA-aggregatie, GA4 gedeeltelijk en social metrics niet vergelijkbaar qua scope.
- Implementatie in PR: `supabase/migrations/20261117162500_powerhouse_cro_site_social_diagnostics_v1.sql`.
- Regression: `tests/brain-cro-site-social-diagnostics-20261117.test.mjs`.
- Machineleerrecord: `brain/learning/2026-11-17-cro-site-social-diagnostics-v1.json`.
- Herstel tijdens levering: eerste Required-run `PR_MACHINE_METADATA_INVALID:BASE_SHA_INVALID,BASE_SHA_MISSING`; gecorrigeerd met exacte Base-SHA. Tweede Required-run detecteerde `INTEGRATION_BUNDLE_CLOSURE_INCOMPLETE:activity_ledger,human_documentation`; deze ledger en menselijke uitleg zijn daartoe toegevoegd zonder veiligheidspoorten te versoepelen.
- Pre-merge SQL verificatie: echte database `BEGIN ... SELECT ... ROLLBACK`, 40 postprojecties in transactie. Niets in productie gemigreerd vanuit deze verificatie.
- Status tijdens schrijven: kandidaat; niet onafhankelijk live, niet bewezen tot commercieel effect.
- Regels: geen PII, geen bruto formulierinhoud, geen omzeiling van toestemming, geen fictieve paid orders, geen missend bewijs als nul, geen tweede meet-/leerlus.
- Volgende verificatie: exacte head CI Required/CodeQL, migratie-lock, beschermde merge, Supabase productiereadback van service-only views en originele CRO/Heartbeat-effectobservatie.

## Scoped CI failure and recovery — 17 November 2026
- Exact rejected head `653c54ee9d4d9dae49219d5e6ba38cd6d7762698`: Required preflight failure `SCOPE_CONTAMINATED` because PR metadata `Change-Scope: 5 files` was a placeholder; `Scope-Budget: 5 files` was also not parseable as an integer.
- Repaired the **same** PR #5964 metadata to four explicit non-verification paths with `Scope-Budget: 4`. The existing `tests/` file remains a verification artifact, not a new product file; existing fail-closed hygiene code was not altered.
- The prior failed run stays as evidence. Only a new exact-head Required + CodeQL pass, preview migration replay and post-merge provider readback may establish release completion. No assertion of paid conversion or live site improvement from this documentation step.

## Addition without a parallel executor — email learning, 17 November 2026
- Existing canonical `powerhouse_email_learning_stats` (11 rows) last updated 2026-10-28; 27 historical reported sends, two replies. Original `powerhouse_sales_actions` has no execution in the past seven days, nor a send+readback verified execution. No positive revenue claim.
- Added third read-only, service-only invoker email signal to **same** SQL migration, with original send evidence and suppression counts, no subject/recipient/body exposure.
- Separate actual Supabase transaction compiled the view and read four strategy diagnostics; all returned `NO_RECENT_VERIFIED_EMAIL_SEND`, before transaction rollback. This is not a live applied migration.
- Same original PR, exact four-file product scope plus verification test, no changed scheduler or protected policy. Required/CodeQL, migration history, service-role readback, original consumer, and independent commercial effect remain terminal proof obligations.
