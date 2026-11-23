# Bestaande centrale blogpublisher — herstel brongebonden delivery (23 november 2026)

## Aanleiding
De oorspronkelijke writer `approved-central-blog` maakte PR's zonder verplichte machinevelden of Brain-leer-/ontwikkellog-/menselijke documentatie. Na officiële Actions-goedkeuring faalde Required correct. Nog belangrijker: dezelfde in september goedgekeurde, maar ondertussen door 301 geconsolideerde typo-blog werd elf keer als duplicaat voorgesteld, omdat de bron de redirect niet controleerde.

## Structurele wijziging
- De originele Notion-due-selector slaat slugs met een bestaande 301 naar een andere canonical blog over; oude lokale bronbestanden blijven uitgesloten.
- De oorspronkelijke publisher maakt bij **een echt goedgekeurde bron** vóór de commit exact drie geverifieerde brongebonden bewijsbestanden: JSON learning, technisch ontwikkellog en menselijke uitleg. Alle blijven nadrukkelijk `CANDIDATE_NOT_LIVE`.
- De originele GitHub candidate krijgt `Obligation-ID`, `Delivery-Lane`, `Candidate-Type`, oorspronkelijke `Base-SHA`, exacte `Change-Scope`, `Scope-Budget` en `Supersedes` uit de echte bron, niet uit placeholdertekst.
- Een uitvoeringsfixture voor `verification_mode` wordt nooit naar een externe PR gestuurd.
- Een reeds bestaande kandidaat met afwijkende bronidentiteit wordt niet overschreven.

## Bewijs en open acceptatie
De oorspronkelijke 2026-09-17 Notion-rij is al met onafhankelijke readback op `Blocked`, `Autopublish=false` en canonical link gezet. De elf typo-duplicaat-PR's zijn zonder merge gesloten. Deze nieuwe code is een **beschermde kandidaat**, geen providerpublicatie. Exact-head Required/CodeQL/hygiene, reviewer/BG169, bijpassende Netlify-SHA, openbare artikel-URL en originele ONE BRAIN/Heartbeat-consumptie zijn nodig vóór live-status. De dagverplichting `2026-11-23:blog` blijft apart OPEN.
