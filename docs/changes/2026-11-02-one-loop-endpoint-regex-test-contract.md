# BRAIN — exacte CRO-route herkenning zonder vals negatieve test

**Datum:** 2 november 2026 · **P0:** #4439, bestaand releasebewijsincident #4918 · **Eigenaar:** oorspronkelijke ONE BRAIN-testcontract / Netlify Production Truth.

## Reproduceerbare oorzaak

In de volledige originele BRAIN-run `41422715260` (backendjob `125202175531`; 5.377 totaal, 5.352 geslaagd, **23 mislukt**, twee overgeslagen) faalt test #2486 in `tests/brain-one-loop-terminal-live-receipt-20261030.test.mjs`. De bestaande menselijke bron `docs/changes/2026-10-30-one-loop-deploy-proof-release-guard.md` bevat de echte afzonderlijke route `/api/powerhouse-cro-other-data`, expliciet zonder een bewezen onafhankelijke twee-tenant-E2E-proef. De test gebruikt echter een JavaScript-`\b` woordgrens vóór `/`: Markdown-backtick en slash zijn allebei niet-woordtekens, waardoor de geldige bron ten onrechte wordt afgekeurd. Dit is een **test-oracle-false-negative**, geen nieuw productie-/autorisatiebewijs.

## Gerichte bronreparatie

Behoud alle oorspronkelijke runtime, portaalbronnen, `one_loop_assurance_proof`, provider-ID's, tenant-auth en documentatie ongewijzigd. De reguliere expressie accepteert nu alleen een afzonderlijke exacte route met geldige afbakening en verwerpt een woordprefix of toegevoegde `-fake` / `/private` route. Positieve én negatieve fixture-assertions zitten in hetzelfde oorspronkelijke BRAIN-testbestand. De bestaande agentregel in `.agents/skills/powerhouse-netlify-production-truth/SKILL.md` blijft leidend: een nette documentverwijzing is nooit onafhankelijk CRO-providerbewijs.

## Uitrol en bewijs

Het verschil mag alleen via Required + BRAIN + CodeQL op exacte head, originele beschermde GitHub-merge en toepasselijke originele terminalcontrole worden samengevoegd. De andere **22** oorspronkelijk gemeten fouten zijn hiermee niet opgelost. Geen tweede writer, CMS-publicatie, portaalstatusoverschrijving, BRAIN-PROVEN of omzetclaim. De nieuwe ONE BRAIN-learning blijft `SOURCE_CANDIDATE` tot een volledig onafhankelijk resultaat de smalle fix aantoont; alle historische rode runs blijven traceerbaar. Portaal toont alleen de oorspronkelijke, geverifieerde registry-observatie.

## Herhaling voorkomen

Bij broncontracten met URL's, UUID's en padsegmenten mag `\b` nooit automatisch als grens vóór een niet-woordteken worden gebruikt. Valideer altijd op zowel een echte positieve bronvorm als op kwaadaardige of foutieve prefix/suffixvarianten. Registreer een nieuwe occurrence onder dezelfde fingerprint bij herhaling en stuur herstel terug naar de oorspronkelijke eigenaar en SkillOps; verlaag de echte provider- en auth-gates nooit om een stringtest te laten slagen.
