# Delivery ledger — herstel gecombineerde klantstate

**Obligation-ID:** portal-ai-activation-layer-readback-20261015

Bij code-inspectie vastgesteld dat de `portal` namespace in de canonieke laag de legacy-projectie compleet overschrijft. Wanneer een klant een modelkeuze/activeringsaanvraag opslaat in de legacy tenantstate, kan een gewone canonieke Brain-update daardoor onbedoeld de aanvraag uit de gecombineerde tenantstate verwijderen.

De compositiemodule `platform/read-models/portal-projection-layers.mjs` combineert daarom de `portal` velden op eerste niveau met canonieke voorrang. Tests in zowel `tests/portal-projection-layers.test.mjs` als de bestaande verplichte Brain-test reproduceren het incident en tonen herstel.

**Nog niet als afgerond geclaimd:** Required CI, CodeQL, geschützte merge, productie-uitrol en productie-readback. Een bewaarde activeringsaanvraag blijft alleen een verzoek; geen leverancier wordt automatisch geactiveerd.
