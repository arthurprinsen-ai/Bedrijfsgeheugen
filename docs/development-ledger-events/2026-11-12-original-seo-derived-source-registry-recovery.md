# Originele SEO-opportunity-bronregisterhandshake — 12 november 2026

**P0:** #4198 · **Fingerprint:** `seo|original-derived-opportunity-source-registry|20261112-v1`  
**Eigenaar:** bestaande SEO-resolver #105 → originele bronarchivering #175 → ONE BRAIN-consumer #140 → Heartbeat/Portal. Geen nieuwe cron, provider, agent-executor of parallel publicatie.

## Productiebewijs vóór reparatie

- Originele, beveiligde `bg_roep_functie('powerhouse-seo-opportunity-resolver')` gaf HTTP request `29209`; Supabase `net._http_response` rapporteerde **503** met `SEO_SOURCE_OBSERVATION_WRITE:SOURCE_NOT_REGISTERED:seo-opportunity-intelligence`.
- Dezelfde resolver schreef aantoonbaar 18 recente DataForSEO-cachewaarnemingen naar de bestaande canonieke NL-SEO-tabel: eerder 15 rijen, nu 33; 18 met echte bronmeetdatum binnen zeven dagen. Nieuwste meting blijft 9 november 2026 — geen verzonnen providerbezoek of rangpositie.
- `powerhouse_evidence_sources` bevatte bestaande `dataforseo-intelligence`, maar geen `seo-opportunity-intelligence`. Die twee representeren bewust verschillende feiten: echte externe providerwaarnemingen versus afgeleide opportuniteitsbeslissingen.
- Vóór deze registratiereparatie is geen terminale `SEO_SOURCE_OBSERVATION_WRITE`-ACK of nieuwe ONE BRAIN-consumer-ACK bewezen. Eerdere `bg_gezondheid status=ok` gedurende de run betekent hooguit een eerder stadium, geen geslaagde eindoverdracht.

## Bestaande infrastructuur repareren

Een nieuwe append-only migratie `20261112203100_original_seo_opportunity_source_registration_v1.sql` schrijft alleen de ontbrekende optionele bron in de bestaande registry, `source_class=derived_intelligence`, writer `powerhouse_record_source_observation_v1`, owner `powerhouse-seo-opportunity-resolver`, 30 uur versheidsvenster. `ON CONFLICT DO NOTHING` met exact readback-conflictguard; geen privileges, JWT, RLS, tabellen of schedulers.

ONE BRAIN-learning `brain/learning/2026-11-12-original-seo-derived-source-registry-recovery-v1.json`; bestaande regressie `tests/brain-original-seo-keyword-cache-bridge-20261112.test.mjs`.

## Verplichte sluiting
Beschermde Required, CodeQL, echte Supabase Preview en migratiebronlock → protected merge → native Supabase provider registratie inclusief rij-readback → exact één oorspronkelijke veilige resolver-hercontrole (providerresponse, observation-id, original dedupe) → originele #175 bronrevisie → #140 processed consumer ACK → Heartbeat/Portal → echte 7/14/28-dagen Google/Bing/ChatGPT/referral-sessies en CTA/lead/omzetmeting. De bronregeling blijft **OPEN** totdat alle relevante afhankelijke receipts bewijsbaar zijn. Geen claims over extra echte bezoekers.
