# 9 november 2026 — één keten: LinkedIn-bedrijfspost → provider-meting → BRAIN → volgende post

De originele Powerhouse-productieketen is aangetroffen en behouden: content-orchestrator → onafhankelijk `LIVE_PROVEN` provider-publicatiebewijs → `social_posts` → Windsor `powerhouse_growth_source_daily_v1` → bestaande `bg-social-metrics-sync` → `social_metric_snapshots` → originele runtime-mux op minuut 39 → `social_learning_evaluations`/`social_learning_applications`/`social_learnings` → volgende originele generator.

## Wat kapot was

Windsor had op 8 november een echte onafhankelijke providerobservatie van `urn:li:share:7524367540987301888` (6 november, 183 impressies, 1 like) opgeslagen. De organisatieauteur en het LIVE_PROVEN bewijs komen exact overeen. De originele sync leest echter uitsluitend oudere `quality=PROVIDER_OBSERVED_UNLINKED` en de verificatiehelper verwacht oude `evidence`-velden. De nieuwste ingest gebruikte `quality=PROVIDER_OBSERVED` met de identiteitsmarker `post_identity=PROVIDER_OBSERVED_UNLINKED` en de provider-UR(N)/share-URL/metricdatum in `metrics`. Daarom zijn 0 snapshots van die post naar het originele leerproces doorgestuurd, hoewel de cron succesvol was en andere kanalen metrics gaven.

## Veilige correctie in dezelfde eigenaar

Twee bestaande bronbestanden zijn aangepast, geen nieuw subsysteem: `supabase/functions/bg-social-metrics-sync/index.ts` en `supabase/functions/_shared/linked-company-analytics.mjs`. Het nieuwe providerformaat wordt uitsluitend toegelaten met de originele bewijsmarker, exacte LinkedIn-URN, org-auteur, historische publicatietijd, provider-account, share-ID, share-URL, bron-/publicatiedatum en echte numerieke metrics. Oude bronformaten blijven ondersteund. Een lege bedrijfshandoff mag de totale broncontrole niet meer GREEN laten worden via Instagram/persoonlijk alleen.

## Acceptatie en verantwoordelijkheid

De bestaande tests krijgen een echte nieuwe bronvariant plus negatieve identiteits-, bron- en datummatches. De oorspronkelijke six-hour source cron blijft actief; original runtime mux minuut 39 blijft enige evaluator. Protected Required, CodeQL en merge eerst; pas daarna deployment van de exact beschermde bron, originele metrics-observerreadback en verifieerbare `social_learning_evaluations` + `social_learning_applications`. Bij onvoldoende vergelijkbare controle blijft `actual_effect=NULL`, terwijl 183 impressies alleen descriptieve exposure bewijzen. Geen claim van meer klanten, leads of omzet zonder oorspronkelijke verkoop- en attributiebewijzen.

**Status bij commit:** kandidaat, nog niet live bewezen. Oorspronkelijk incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198; test `tests/brain-windsor-native-learning-provider-repair-20261105.test.mjs`; machinelearning `brain/learning/2026-11-09-original-windsor-social-learning-handoff-v1.json`.
