# SEO Opportunity Intelligence en first-mover publicatie

## Probleem
De zoekdata waren niet afwezig. De DataForSEO producer draaide gezond maar gaf voor de live domeinranking nul items terug, terwijl in `bg_zoekwoordkansen` nog geldige volume/CPC/rankingdata stond. Google Search Console synchroniseerde tegelijk wel dagelijks naar `bg_zoekprestaties`. De dagelijkse analyse gebruikte die bronnen niet als één canonieke evidenceketen.

## Structurele oplossing
Powerhouse krijgt één resolver vóór de contentbeslissing. Die leest eerst verse GSC-data, daarna geldige DataForSEO-cache en vervolgens actieve externe marktvoorspellingen. Alleen wanneer een commercieel belangrijke vraag daarna nog onopgelost is, mag een begrensde betaalde live enrichment volgen.

De resolver berekent een first-mover score op basis van vraag, CPC, ranking gap, GSC-signalen, whitespace en externe voorspellingen. Hij bewaart de voorspelling vóór uitvoering zodat latere clicks, leads, orders en omzet de hypothese kunnen kalibreren.

## Autonome beslisregel
Een bestaande canonieke intent-owner wordt eerst verbeterd. Powerhouse maakt alleen nieuwe content wanneer geen eigenaar bestaat en een aparte commerciële zoekintentie voldoende bewijs heeft. Alleen zo'n `CREATE_INTENT_GAP_CONTENT`-besluit gaat als blogrecommendation naar de bestaande content-orchestrator. Er is geen parallelle publisher.

## Snelheid / first mover
De scheduler loopt na de dagelijkse DataForSEO- en GSC-ingest en vóór de ochtendpublisher. Daardoor kan een nieuwe aantoonbare zoekkans in dezelfde ochtend door forecast, contentgeneratie, protected GitHub delivery en productie-readback lopen.

## Truth boundary
CPC, volume, ranking gap, first-mover score en probability zijn signalen. Ze mogen nooit als gerealiseerde omzet worden geboekt. Alleen echte CTA-, lead-, order- en revenue-outcomes sluiten de commerciële learning.
