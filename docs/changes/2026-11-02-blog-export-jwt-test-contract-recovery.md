# 2 november 2026 — beveiligde blog-export: verouderde JWT-testverwachting

## Reproduceerbaar probleem
De oorspronkelijke volledige Unified BRAIN backend-run [41409216287](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/41409216287) heeft 5.352 tests uitgevoerd: 5.318 geslaagd en 32 gefaald. Eén daarvan, `tests/brain-daily-blog-edge-config-registration-v1.test.mjs`, gebruikte één uniforme verwachting `verify_jwt=false` voor twee functies met bewust verschillende beveiligingsmodellen.

## Onafhankelijke broncontrole
Op 2 november 2026 is het oorspronkelijke Supabase-project `adhjwmvyoixzjtmiroln` uitgelezen. `powerhouse-blog-export` is ACTIVE v297 met `verify_jwt=true`; `powerhouse-blog-queue` is ACTIVE v301 met `verify_jwt=false`. De huidige beschermde `supabase/config.toml` bevestigt beide afzonderlijke waarden. De exporter vereist bovendien exact een service-role-bearer, anders `EXPORT_AUTH_REQUIRED` 401, en expliciete `approved_at` met toegestane status, anders `BLOG_PUBLIC_EXPORT_NOT_APPROVED` 403. De queue heeft afzonderlijke interne `x-powerhouse-token` controle. Bestaande `tests/brain-powerhouse-blog-export-security-contract.test.mjs` eist terecht `verify_jwt=true` voor de export.

## Root cause / herstel / regressie
De bronafwijking zit in de **testverwachting**, niet in een bewezen productiebeveiligingsfout. Wijzig **geen** Edge-configuratie en zet JWT-beveiliging **niet** uit. Herstel uitsluitend de test, die nu per functie exact één expliciete `verify_jwt` declaratie en de juiste waarde toetst. Voeg tweede negatieve regressie toe: exporter blijft provider-JWT + service-bearer + verplicht goedgekeurd artefact afdwingen. Het originele ONE BRAIN-incident en de oorspronkelijke `powerhouse-social-recovery-cooperation` skill/AGENTS bevatten een preventieregel.

## Verificatie en harde grenzen
Test gericht beide originele regressies en daarna alle originele BRAIN backendtests op exact beschermde kandidaat; alleen bij aparte originele terminal-SUCCESS mag één schulditem worden afgevinkt. De overige 31 (of meer/minder na **nieuwe onafhankelijke telling**) blijven onbewezen. Deze PR wijzigt geen productie Edge-implementatie, SQL-migraties, publicatiestatus, OAuth, betaling of content. Required, CodeQL, volledige BRAIN, beschermd merge en onafhankelijke source/provider readback blijven vereist. Productie-JWT-stand is gecontroleerd; er is **geen** nieuw live blogbericht, groen terminalresultaat of commercieel resultaat geclaimd.

Fingerprint: `powerhouse|brain|blog-export-jwt-test-drift|20261102-v1`. Bestaand bovenliggend incident: `powerhouse|brain|postmerge-backend-suite-34-failures|20261102-v1`. Oorspronkelijk issue: [#4439](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4439).
