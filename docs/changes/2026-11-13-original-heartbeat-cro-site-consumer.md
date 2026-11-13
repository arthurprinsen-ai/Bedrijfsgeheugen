# 13 november 2026 — Herstelde ontvangende CRO/Heartbeat-schijf van dezelfde SEO-keten

## Foutbeeld en bronbewijs
Dezelfde originele SEO-resolver #105 heeft op 13 november twee onafhankelijke website-readbacks exact gekoppeld aan originele `GROWTH_SOURCE_DAILY_HANDOFF` `40b62d82-dcd3-4a44-98d0-3f94071008a9`, bronrevision `937fd65725813cf0320465b5a92231d86f0faf5327bdd128057e2b6c16baacfb`, originele #140 ACK, en PR #5700 productie SHA `66b67ac366e073ca068e5f1e23938a9792ae7dce`. De bronproducent én SEO-uitvoerder hadden bewijs, maar de bestaande commerciële Heartbeat registreerde nog geen ontvangst van die specifieke twee sitewijzigingen. Zo was de overgang naar CRO niet aantoonbaar.

## Reparatie in de bestaande #140 Heartbeat
De `public.powerhouse_commercial_intelligence_heartbeat_v1(date)` draait reeds binnen `powerhouse_content_closed_loop_tick_v1` van cronjob **#140**. Deze bestaande ontvangende Heartbeat krijgt binnen zijn **bestaande** idempotente `powerhouse_runtime_events`-record een onderbouwde `original_site_to_cro_handoff` JSON-receipt. Hij leest en verifieert:
- origineel BRAIN-obligation ID, tenant, Amsterdam-business-day, OPEN staat, sha256 source manifest/revisie en exact originele consumer ACK;
- actuele bron SHA uit dezelfde fysieke `powerhouse_growth_source_daily_v1` en originele consumer-observatie; geen stale of vroegere ACK accepteren;
- originele `done` website-aanbeveling en `original_delivery_crosslink` die naar hetzelfde ID, dezelfde SHA, pagina en gecontroleerde release-SHA verwijzen;
- onafhankelijk echt Netlify/public canonical/CTA/DataForSEO readback, plus origineel `source_manifest.website_release_readback` met dezelfde URL, HTTP 200 en releasecommit.

Het ontvangende proces schrijft **alleen** de ontvangst in het oorspronkelijke dag-Heartbeat-event, onder exacte `source_revision`, `site_receipt_count` en iedere `recommendation_key`. `next_stage=CRO_PROSPECTIVE_EXPERIMENT_REQUIRED` en `cro_treatment_executed=false`; geen A/B-sturing, geen handmatig nieuw experiment, geen beweerde omzet of volgende leercyclus. Als enige match ontbreekt, is ontvangst niet bewezen.

Geen nieuwe cron, parallelle agent, queue, tabel, publieksendpoint of social publisher. `service_role` houdt execute, `anon/authenticated/PUBLIC` expliciet geweigerd. Bestaand #140 blijft bij herstelbare fouten actief. De oude 2026-11-10 Twinfield-rij zonder exact origineel source record wordt niet achteraf gefabriceerd.

## Noodzakelijke onafhankelijke acceptatie
1. Beschermde Required + BRAIN + CodeQL, geen toegangs- of merge-bypass.
2. Exacte originele SQL-migratie-ID op echte Supabase-productie en productie-`pg_get_functiondef` + ACL readback.
3. Gecontroleerde eenmalige interne Heartbeat-functieuitvoering voor 13 november (geen provider side effect), `powerhouse_runtime_events` opnieuw lezen: bewijs moet `site_receipt_count=2`, unieke Exact Online/Twinfield aanbevelingssleutels, exact origineel BRAIN-ID, bron-ACK en release-SHA bevatten.
4. Tweede aanroep: precies dezelfde originele `dedupe_key`, geen tweede event, dezelfde receipt identities.
5. Oorspronkelijke `GROWTH_SOURCE_DAILY_HANDOFF` 11–13 november blijft OPEN; CRO experiment treatment/holdout, GA4/GSC causale effecten, gekwalificeerde lead, betaalde order en next-run learning blijven afzonderlijk onvoltooid. Niet groen maken zonder daadwerkelijk provider/assigment/outcome bewijs.
6. Eventuele migratiehistorie-append alleen nadat werkelijk toegepaste nieuwe productie-migratie onafhankelijk is bevestigd en alle voorgaande records gelijk zijn.

Productieproblemen preview/snapshot-bron blijven in origineel incident https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198; source-only merge niet als productielive presenteren.
