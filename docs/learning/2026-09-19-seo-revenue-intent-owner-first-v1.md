# SEO revenue loop: intent-owner-first

Fingerprint: `seo|revenue-growth|intent-owner-first|v1`

## Waarom deze regel bestaat

SEO voor Bedrijfsgeheugen moet niet worden geoptimaliseerd voor verkeer als doel op zich. De keten is zoekvraag → relevante pagina → CTA → lead → opportunity → order → omzet.

Een bestaande money- of pillar-pagina die een zoekintentie al bezit, wordt daarom eerst verbeterd. Een nieuw blog of een nieuwe landingspagina komt alleen in aanmerking wanneer een aantoonbaar andere intentie nog geen canonieke eigenaar heeft.

## Wat op 19 september 2026 is veranderd

- De SEO opportunity engine weegt commerciële/transactionele intentie, volume, CPC, trend, ranking- en conversiegap mee.
- Bestaande intent-owners krijgen voorrang boven nieuwe content.
- De typo/duplicate `onprijsd-probleem-bedrijfsvoering` is geconsolideerd naar de canonieke `ongeprijsd`-URL.
- `/excel-als-crm` kreeg een extra inhoudelijk relevante interne link.
- De omzetdoelstelling is gekoppeld aan het dagelijkse opportunity-proces.

## Fout die is gevonden

Een eerdere PR gebruikte `seo-growth` als Delivery-Lane. Dat is een domeinlabel, geen canonieke delivery-lane. De control plane accepteert alleen de lanes uit `config/powerhouse-delivery-hygiene-v1.json`. Voor deze wijzigingen zijn `backend`, `website` en voor de closure `docs` gebruikt.

## Permanente werkwijze

Deze pagina is de menselijke uitleg naast de canonieke Brain-learning; bij verschil blijft de Brain-learning leidend.


1. Lees eerst de bestaande intent-owner uit de SEO maps.
2. Gebruik first-party zoek- en conversiedata vóór betaalde verrijking.
3. Verrijk alleen de hoogste evidence-gaps bounded met DataForSEO.
4. Maak maximaal vijf dagelijkse opportunities.
5. Voorkom cannibalisatie vóór contentcreatie.
6. Gebruik contextuele interne links.
7. Claim geen live-status vóór exact production deploy identity en readback.
8. Borg materiële learnings in Brain, ledger, human documentation, replay-test en skill-projectie.

## Productiebewijs

De kernwijzigingen zijn gemerged via PR #2389, #2396 en #2399. Netlify production deploy `6aae87a3977cfc000881553f` is `ready` op commit `1a8169c82dbbe2238e62a4f91de8600db193903e`.

De externe web-indexreader kan kort na deploy nog gecachte HTML tonen; provider deploy identity en repository readback blijven daarom afzonderlijke bewijsbronnen.
