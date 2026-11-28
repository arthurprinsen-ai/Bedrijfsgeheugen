# PW MO14-1 Veldhockey — Jackie keeper en Coco-Mijn spits

Datum: 20 november 2026.

## Afspraak

Een aparte veldmodus naast de zaalcoach; de vorige zes veldhockey-opstellingskaarten moeten gecorrigeerd worden naar **Jackie als vaste keeper** en **Coco-Mijn als veldspeelster in de voorhoede**. Nine begint in de spits. Isis speelt nooit centraal achterin. Er zijn 11 speelsters tegelijk in het veld, inclusief keeper, twee op de bank, en zes wisselblokken over 70 speelminuten. De veldmodus is nadrukkelijk géén zaalwedstrijd (6 tegen 6).

## Uitwerking

- De bestaande aparte site `pw-mo14-1` bevat nu `/veldplanner/` naast `/zaalplanner/`; op de zaalcoach staat een navigatielink met de volledige absolute URL naar de veldmodus.
- Veldmodus: 6 blokken 0–12, 12–24, 24–35, 35–47, 47–59, 59–70 minuten. Steeds 11 op het veld, 2 bankzitters, 2 simultane wissels bij vijf blokgrenzen, 4-4-2 ruit.
- Bank per blok: (1) Bobbi + Femke; (2) Isis + Coco-Mijn; (3) Cato + Nine; (4) Tess + Steffie; (5) Ella + Lidewij; (6) Eline + Lizzy.
- Jackie blijft keeper voor 70 min. Coco-Mijn is uitsluitend aanvaller op de momenten dat zij op het veld staat. Alle overige veldspeelsters hebben 1 rustblok van 11–12 min, wat leidt tot 58–59 min speeltijd.
- Bediening op mobiel: zes bloktabs; per blok veldvisualisatie, bank, volgende wissel, print van zes A4-pagina's als PDF en download van een individuele veld-PNG. De oorspronkelijke zaalberekening is niet gewijzigd.
- KNHB officiële speelduur: https://www.knhb.nl/competitie/veldcompetitie/regelgeving/spelregels/basisregels — 4×17,5 min, samen 70 min.

## Productiebewijs

- Canonieke GitHub→Netlify-run: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/44732555993, resultaat SUCCESS. Geen Make.
- Oorspronkelijke site-ID: `1c4fa5ce-45ae-45dc-b3e2-11f90587c474`; provider-deploy `6b003721ccd464e932bd05a5`, CURRENT/READY.
- Onafhankelijke Netlify-readback tijdens GitHub-run: `/veldplanner/` byte-identiek aan GitHub-bron, `/zaalplanner/` intact en oorspronkelijke homepage ongewijzigd. Source-check `tests/mo14-field-jackie-keeper-six-blocks-20261120.test.mjs` controleert 6 blokken, 11 op veld, twee bank, juiste rollen, maximale 2 wissels en speelminuten.
- Extra interactieve browserproductietest https://pw-mo14-1.netlify.app/veldplanner/ : alle zes blokken, banklijsten, Jackie's keeperspositie en Coco-Mijn als aanvaller, drukcontainer van zes pagina's, mobiele 390px-weergave zonder horizontale overflow; afzonderlijke PNG wordt met canvas als PNG gerenderd.
- Grens: deze zes veldkaarten zijn een vaste gecontroleerde basisplanning. De nieuwe veldmodus bevat nog geen dynamische uitval-/rosterberekening zoals de afzonderlijke zaalcoach. Claim die mogelijkheid niet.
