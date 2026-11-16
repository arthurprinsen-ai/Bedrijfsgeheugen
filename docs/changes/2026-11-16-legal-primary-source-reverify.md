# 16 november 2026 — wettelijke bronnen actueel, drie verlopen reviewtermijnen
Incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5920

## Productiebewijs uit bestaande CI
De oorspronkelijke Required-workflow https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/43842981950 faalde op `tests/delivery-regelgeving-actueel.test.mjs`: `rechtsvermoeden-uurtarief`, `zelfstandigenwet` en `loontransparantie` waren uiterlijk 15 november te herzien. Dit was een terecht fail-closed mechanisme. Los van persoonlijke LinkedIn-code.

## Verificatie 16 november 2026 via officiële primaire bronnen
1. **Uurtariefrechtsvermoeden**: aangenomen 16 juni, bekendgemaakt Stb. 2026, 158, inwerkingtredingsbesluit Stb. 2026, 207 stelt expliciet **31 december 2026** vast. Oude weergave met beoogde 1 januari 2027 en 'KB volgt' was feitelijk verouderd. Officiële bron: https://zoek.officielebekendmakingen.nl/stb-2026-207.html en https://www.eerstekamer.nl/wetsvoorstel/36783_wet_invoering.
2. **Zelfstandigenwet**: officiële consultatie liep 1–29 oktober 2026, status nog voorstel; antwoorden minister aan Tweede Kamer 9 november bevestigen dat voorstel nog niet definitief is. Beoogd 2028, geen rechtsgeldige ingangsdatum. Bronnen: https://wetgevingskalender.overheid.nl/Regeling/WGK029502 ; https://www.internetconsultatie.nl/verduidelijkingzelfstandigenwet/b1 ; https://www.tweedekamer.nl/kamerstukken/kamervragen/detail?did=2026D56524&id=2026Z22529 .
3. **Loontransparantie**: EU-richtlijntranspositietermijn 7 juni 2026 verstreek, maar Nederlands implementatievoorstel is op de Rijksoverheidspagina nog niet door beide Kamers aangenomen. Beoogd 1 januari 2027 is strikt conditioneel. Eerste rapportage ten minste 150 werknemers beoogd 7 juni 2028. Officiële bron https://www.rijksoverheid.nl/themas/werk/gelijke-behandeling-op-het-werk/plannen-kabinet-meer-openheid-over-loonkloof-tussen-mannen-en-vrouwen .

## Concreet herstel in originele keten
In `portal-v2/regelgeving.js` zijn **inhoud én status/mijlpalen én exacte officiële URL én hercontrole** per drie regels aangepast. `peildatum=2026-11-16` en `herzienUiterlijk=2026-12-15` zijn uitsluitend toegevoegd samen met nieuwe officiële verificatie. Een afzonderlijke regressietest test dat de juridische statussen niet als geldend worden geclaimd en dat CI op 16 december terecht weer rood gaat indien hercontrole uitblijft. Geen wijziging aan testfouten, tijdlogica, automatische crons of deploycontrole.

## Governance
Bestaande juridische broneigenaar, bestaande protected merge en bestaande Netlify/Portal V2 blijven leidend. Vóór GREEN: exact-head Required + CodeQL, protected merge, Netlify CURRENT READY, onafhankelijk GET/DOM van de oorspronkelijke Portal V2, ONE BRAIN leerregister. Zonder die bewijsstappen staat dit op `CANDIDATE / NOT LIVE`; niet de juridische status of controledatums vervalsen.

De nieuwe CI wordt als aparte originele juridische broneigenaar aangeboden om de algemene gate te repareren, waarna aparte LinkedIn PR https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5917 met eigen tests opnieuw veilig kan worden uitgerold.
