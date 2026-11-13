# 13 november 2026 — Eén oorspronkelijke SEO → ONE BRAIN → website → CRO-keten

## Productieprobleem
De originele cron #105 `powerhouse-seo-opportunity-resolver` produceert gefilterde zoekwoordaanbevelingen en eigenaarsoverdrachten; de bestaande website-SEO Order Engine heeft op 13 november de money pages Exact Online en Twinfield geoptimaliseerd via beschermde PR #5700, Netlify en onafhankelijke publieke DataForSEO-page-readback. De data-archivering #175 registreerde daarna dezelfde website-release in de oorspronkelijke `GROWTH_SOURCE_DAILY_HANDOFF`. ONE BRAIN #140 bevestigde exact de bron-SHA. Maar de bestaande `powerhouse_content_recommendations` met status `done` droegen nog geen formele kruisverwijzing naar die originele ONE BRAIN obligation en de **exacte** `source_revision`. Daardoor bleef feitelijke website-uitvoering zichtbaar op één plek en het oorspronkelijke commerciële ketenbewijs op een andere plek.

## Smalle reparatie binnen de originele uitvoerder
De enige bestaande Edge-handler `supabase/functions/powerhouse-seo-opportunity-resolver/index.ts`, aangeroepen door actieve bestaande cron #105, leest bij de normale run maximaal vier recente dagen originele `brain_obligations.GROWTH_SOURCE_DAILY_HANDOFF` en `done` SEO-money-page-aanbevelingen. Nieuw **puur** verifier-model `original-delivery-crosslink.mjs` bevestigt alleen bij exacte matching van tenant, capability, Amsterdam-dag, producent-SHA256, originele #140 consumenten-ACK, bronmanifest met geverifieerde Netlify-release/commit/route, aanbeveling `done`, onafhankelijke publieke DataForSEO request-ID en echte CTA-/canonical-readback.

Als al die bestaande feiten kloppen, krijgt **diezelfde aanbeveling** `evidence.original_delivery_crosslink`: originele `obligation_id`, onveranderlijke bron-SHA, matchende ACK, pagina-URL, geverifieerde releasecommit, bron-deploy-ID, onafhankelijk pagina-deploy-ID en DataForSEO request-ID. Geen nieuwe tabel, queue, scheduler, publisher, agent, trackingcookie, externe verzender of voortijdige afsluiting.

### Robuustheid
- Optimistische `updated_at` compare-and-swap op exact dezelfde oorspronkelijke aanbevelingsrij; bij gelijktijdige mutatie **fout en volgende originele run opnieuw**, geen last-writer-wins.
- Na write onafhankelijke reread van exact dezelfde rij; zonder geldige identieke fingerprint geen succesclaim.
- Bestaand exact record + revisie is idempotent; nieuwe bronrevisie vereist nieuwe ACK en een opnieuw verifieerbare bron-release.
- Ontbrekende bron, andere releasecommit, stale of foutieve ontvangst, onverwachte tenant, niet-live pagina, incomplete provider of ontbrekende publieke CTA blijven `WAIT_EXACT_ORIGINAL_SITE_PROOF` met expliciete eigenaar en reden.
- Site-uitvoering is **niet** gelijk aan een prospectief treatment/holdout-experiment, GA4/GSC attributie, gekwalificeerde lead, order, betaalde omzet of toegepast leren. Original `GROWTH_SOURCE_DAILY_HANDOFF` blijft `OPEN` en SEO-assurance blijft terecht `RED` / `WAIT_PRODUCTION_ACTION` zolang originele CRO-outcome bewijsstappen ontbreken.

## Productieacceptatie
Protected Required, BRAIN, CodeQL, echte Edge-provider deploy via oorspronkelijke CI/CD en exacte productiefunctieversie/import-readback zijn afzonderlijk nodig. Na de volgende natuurlijke #105-tick: lees bestaande money page aanbevelingen, bevestig de oorspronkelijke `obligation_id`/ACK/SHA en de onafhankelijke release/provider ID in `original_delivery_crosslink`, bewijs dat Exact Online/Twinfield niet dubbel worden gepubliceerd en dat de bronverplichtingen niet vals gesloten zijn. Controleer source→CRO owner ACK en meetbron apart; pas na bestaande experimentpolicy+assignment, echte exposure, providergebaseerde CTA/leads/orders en next-run learning kan volledige keten eventueel groen worden.

Incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198.
