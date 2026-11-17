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
