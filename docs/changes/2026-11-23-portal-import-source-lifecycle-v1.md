# Portal V2 CSV/Excel — gecontroleerd bronbeheer

Datum: 23 november 2026. Oorspronkelijke keten: Portaal V2 → BusinessInput → ONE BRAIN → Heartbeat.

## Waarom
Een handmatig geïmporteerde bron bleef na import onbeperkt in het portaal staan, ook wanneer deze foutief, verouderd of voor het verkeerde doel werd gebruikt. De gebruiker moet de actuele bron kunnen beheren zonder nieuwe opslag, planning of automatische KPI-mutaties.

## Wijziging
- Op dezelfde **Al geïmporteerd**-lijst staat per bron een expliciete, toegankelijk benoemde actie **Verwijder bron**, met onomkeerbaarheidswaarschuwing vooraf.
- Bestaande tenant-identiteit wordt vóór bevestiging en vóór de persistente wijziging opnieuw gecontroleerd; demo, anonieme modus en niet-geïnitialiseerde domeinstatus zijn uitgesloten.
- De te verwijderen dataset moet op exact één bron-ID én dezelfde SHA-256-fingerprint uit de actuele originele `portal.dataImports.datasets` overeenkomen. Stale of gewijzigde bronnen mogen niet op basis van bestandsnaam worden verwijderd.
- Alleen de betreffende bron wordt uit de bestaande tenantgebonden state verwijderd; alle andere bronrijen en betekenissen blijven intact. De enige writer blijft `domainState.patch("portal.dataImports", ...)` met `flush()`.
- Alleen na onafhankelijke `stateClient.load()` en controle van tenant plus de complete resterende bronvolgorde wordt de handeling als voltooid gemeld.
- Het bestaande state-subscription-mechanisme verwijdert de bronweergave op zijn oorspronkelijke bestemming en uit het centrale catalogusoverzicht. Geen tweede cache/writer, geen KPI-write, geen connectorontkoppeling.
- Dit is **verwijderen uit actuele portaalgegevens** en mag niet worden voorgesteld als gegarandeerde verwijdering uit wettelijke audit, back-up, ONE BRAIN-historie of provider. Een formeel GDPR-verwijderverzoek is een afzonderlijke gecontroleerde keten.

## Regressie en bewijs
Bestaande `tests/brain-portal-v2-data-import-v1.test.mjs` bevat grensgevallen voor exact match, stale fingerprint, dubbele IDs en het onveranderd blijven van andere imports. Het test daarnaast de codecontracten voor bevestiging, eigen tenant, eenmalige bronwriter, flush en server-readback.

Eindbewijzen: Required/CodeQL op exacte PR-head, protected merge, Netlify published SHA en onafhankelijke browsercontrole in productie. Een geautoriseerde klantproef (importeren → bestemmingspagina → verwijderen → verdwenen bron) blijft **EVIDENCE_DUE** zolang die niet echt is uitgevoerd en teruggelezen.

## Niet in scope
Grootbestand-import voorbij huidige limieten; geplande CSV-refresh; tweerichtingsproviderkoppelingen; providercredentials; automatische KPI-koppeling; officiële privacy-erasure-workflow; nieuwe scheduler.
