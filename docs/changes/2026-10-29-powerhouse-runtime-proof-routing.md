# Powerhouse runtimebewijsgate: herstel van statusverwarring — 29 oktober 2026

Canoniek issue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4918
Fingerprint: `powerhouse|runtime|cron-success-without-business-proof|20261029-v1`
Bestaande eigenaar: ONE BRAIN / Heartbeat / Agent Fabric / SkillOps; geen tweede executor.

## Waarneming
De echte productiecontroles van 29 oktober rond 19:48 UTC rapporteerden **32/32 gekoppelde lagen** en **18/18 actieve kernjobs**, maar tegelijk **2 runtimefouten**, **2 ontbrekende leerbewijzen**, `BLOCKED` content, architectuur `AMBER`, en 15 lussen: 8 groen, 3 oranje, 4 rood. De controlplane had bovendien twee oude `RESULT_UNKNOWN`-hersteljobs. Dit betekent niet dat de nieuwe productiecode niet werkt; het betekent dat de uitvoerende en zakelijke bewijsverplichtingen nog niet voldaan zijn.

**Root cause:** `cron.job_run_details=succeeded` van de forecast-calibratiecron bevestigt uitsluitend dat `net.http_post` werd aangeroepen; de achterliggende Edge/providerlevering is een andere stap. De `revenue_flywheel_health`-fout bevat 1.540 due uncalibrated forecasts en 5 nog te verifiëren externe uitkomsten. De volledige `full_cycle_production_proof` rapporteert 1.753 overdue calibrations, `predictive_healthy=false`, `execution_healthy=false` en open publicatieverplichtingen. Dit is geen aanleiding om forecast- of omzetwaarden te verzinnen of errors historisch te wissen.

## Social herstel en onafhankelijke poorten
LinkedIn bedrijf 29 oktober is `LIVE_PROVEN`, de post-URN staat in de oorspronkelijke Supabase-verplichting en mag niet opnieuw worden aangemaakt. LinkedIn persoonlijk is `APPROVED` maar niet gepubliceerd: originele OAuth-scopecode is via protected #5159 en Supabase Edge v479 hersteld; de werkelijke providerverbinding gaf `REVOKED_ACCESS_TOKEN` en nieuwe menselijke consent blijft nodig. Instagram-account is authenticeerbaar maar video `0.900 < 0.940` afgekeurd; alleen een nieuwe, onafhankelijk goedgekeurde mediakandidaat mag worden doorgestuurd. Blog staat op `GENERATED` tot de bestaande beveiligde GitHub→Netlify→openbare browserketen geslaagd is.

## Gekozen ingreep en risico
Deze wijziging **werkt bestaande agentinstructies** bij in `.agents/skills/powerhouse-self-improvement-layer/SKILL.md` en `.agents/skills/powerhouse-social-recovery-cooperation/SKILL.md`. Ze verplichten elke agent tot bronwaarheid, duidelijke incidentverantwoordelijkheid, sterke publicatiebewijsgrenzen, geen blind herstel van `RESULT_UNKNOWN` en geen tweede uitvoeringsproces. Een nieuwe regressie controleert expliciet de aanwezigheid en de consistentie van de eisen. De bestaande SQL-views, crons, provider-routing, kostenplafonds en originele release-eigenaren blijven onveranderd.

Geen automatische **GREEN** bij werkende code alleen. Vereist na deze kandidaat: exact-head Required/BRAIN/CodeQL, protected merge, producer skill-loader + apply bewijs, werkelijke Edge/providerreadback, geauthenticeerde portal-readback en vastgelegd voor/na-leereffect. Er zijn geen database-, productie- of externe publicatiewrites uitgevoerd door deze repositorywijziging.

## Anti-regressie
Regressie: `tests/brain-powerhouse-runtime-truth-routing-20261029.test.mjs`.
Brain learning: `brain/learning/2026-10-29-powerhouse-runtime-proof-routing-v1.json`.
Publieke issue bevat uitsluitend niet-gevoelige technische status; privé cliënt-/tokenmateriaal blijft buiten GitHub.

## Protected admission incident — exact source-PR metadata

De eerste Required-run van deze kandidaat ([40943838921](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/40943838921)) faalde terecht vóór implementatietests met `PR_MACHINE_METADATA_INVALID:BASE_SHA_INVALID,BASE_SHA_MISSING`: de originele PR-omschrijving had geen `Base-SHA`-veld. Dit is niet hetzelfde als een runtime-fout. De volledige, exacte oorsprongswaarde `Base-SHA: bc4ce4a1776fe59d9b7ae70d8191af5151c208d9` is in dezelfde PR toegevoegd. Het issue is in het bestaande `public.brain_failure_registry` opgenomen met fingerprint `delivery|hygiene|missing-base-sha|pr5160|20261029-v1`, occurrence 1, oorzaak, herstel, preventie en bronrun. De volgende codecommit triggert nieuwe head-checks; eerdere FAIL wordt niet gewist of omzeild. Pas na Required/BRAIN/CodeQL en beschermd merge/readback wordt de source-status aangepast.
