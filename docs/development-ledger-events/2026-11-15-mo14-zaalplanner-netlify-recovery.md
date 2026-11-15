# 15 november 2026 — MO14-1 zaalplanner, directe Netlify-publicatie

- Obligation: `mo14-zaalplanner-netlify-release-20261115`; bron-PR: #5875.
- Bestaande site: `pw-mo14-1`, Netlify-ID `1c4fa5ce-45ae-45dc-b3e2-11f90587c474`.
- Product: offline-capable zaalplanner met instelbare keeper, afwezigen, 5 veldspelers, bank, zeven wedstrijdrotaties en PDF/PNG-export.
- Oorspronkelijke GitHub-gate wees ontbrekende PR-identiteit af (`PR_MACHINE_METADATA_INVALID`); hersteld via Obligation-ID, website/implementation en onveranderlijke Base-SHA.
- Tweede gate wees `unclassified delivery path: pw-mo14-1/zaalplanner/index.html` af; hersteld via gerichte registratie van `pw-mo14-1/zaalplanner/` onder bestaande website-lane.
- Derde gate wees `INTEGRATION_BUNDLE_CLOSURE_INCOMPLETE: activity_ledger,brain_learning,human_documentation` af; deze broncommit voegt de drie vereiste canonieke records en een uitvoerbare regressietest toe.
- Make is uitgesloten. Publicatie moet via de bestaande GitHub/Netlify-providerautoriteit verlopen; geen tweede MO14-site en geen ongeautoriseerde overschrijving van bestaande sitebestanden.
- **Nog geen productiebewijs:** de oorspronkelijke Netlify-productie-deploy was `6a8f3d7e1bbd18008c06a44d` (Augustus 2026). De nieuwe bron-PR en geslaagde previews gelden niet als release.
- Acceptatie: beschermde CI volledig geslaagd, PR volgens regels gemerged; daarop exact bestaande site + planner via geautoriseerde Netlify-transport gepubliceerd; provider-deploy-ID, site-ID, inhoudelijke browser-/HTTP-readback en downloadfuncties onafhankelijk geverifieerd.
- Verwijs naar: `brain/learning/2026-11-15-mo14-zaalplanner-direct-netlify-delivery-v1.json`.

## Onafhankelijk productie-resultaat — 2026-11-15 16:09 UTC

- De GitHub Actions-uitvoering https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/43733598207 voltooide met `success`, inclusief bronregressie, backup van `index.html`, `style.css`, `data.js`, `player.js`, `team.js` en `sync.js`, direct Netlify-upload en onafhankelijke HTTP-readback.
- De afzonderlijke Netlify-site `pw-mo14-1` publiceerde provider-deploy `6af9d8a86acb2f10f6e00ed4` met status `CURRENT / READY` op 2026-11-15 16:09:25 UTC.
- De productie-URL `https://pw-mo14-1.netlify.app/zaalplanner/` gaf de verwachte keeperkeuze en PDF-exportcontrole terug. De originele homepage werd byte-voor-byte vergeleken met het vooraf bewaarde exemplaar en bleef gelijk.
- Geen Make gebruikt; uitsluitend de MO14-specifieke GitHub Actions-release en Netlify-provider. Providerobservatie: https://app.netlify.com/projects/pw-mo14-1.
- Scopebeperking: de source-PR #5875 blijft los van deze onafhankelijke siteproductie nog niet beschermd gemerged in de brede Bedrijfsgeheugen-repository; ruimere Powerhouse-CI en gebruikers-interactietests zijn dus niet bewezen groen.

## Mobiele app-ervaring v3 — 15 november 2026

- **Release:** onafhankelijke site `pw-mo14-1`, nieuwe provider CURRENT/READY deploy `6af9ebcb463f126a95c7f903`, gepubliceerd op 2026-11-15 17:29:09Z.
- **Directe uitvoer:** bestaande originele GitHub Actions-route `mo14-zaalplanner-direct-netlify.yml`, succesvolle run [43741276076](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/43741276076), zonder Make.
- **UI:** mobiel app-shell met vier tabs (Opstelling, Selectie, Minuten, Download), vaste navigatie onderaan, bloknavigatie met tikken en vegen, groot veld, zichtbare bank en volgende wissel, lokale opslag, overzicht over 7 wedstrijden.
- **PWA:** manifest `display: standalone`, service worker met uitsluitend `/zaalplanner/`-scope, PNG-iconen 192 en 512, installatie via Safari Delen > Zet op beginscherm.
- **QA op lokaal mobiel browserformaat:** keeper wijzigen, Jackie afwezig melden, opstelling regenereert, 6 personen (5+keeper) op veld, 4 op bank bij volledige selectie, 7 verschillende startopstellingen, PNG + PDF werkend gegenereerd, geen JavaScript-paginafouten.
- **Onafhankelijke productieproef:** providercurrent = nieuw deploy-ID, HTTP `/zaalplanner/` plus manifest, sw.js en beide iconen aanwezig, oorspronkelijke homepage byte-identiek; GitHub Actions `success`.
- **Restgrens:** interactieve productiebrowser-acceptatietest ontbreekt. De hoofdrepository-PR #5875 is niet beschermd gemerged; dat is geen blocker voor de afzonderlijk aantoonbaar gepubliceerde MO14-site, maar blijft open governance-werk.

## Bevestigde actuele app-release — 15 november 2026 17:31 UTC

- De MO14-specifieke Netlify-providercredential `MO14_NETLIFY_PROXY_TEMP` bleek bij run 43740869990 verlopen: `401 Unauthorized`. De credential is als nieuwe versleutelde GitHub Actions-secret via de geautoriseerde Netlify-verbinding vernieuwd; geen tokens in broncode of logs.
- De bestaande directe GitHub→Netlify workflow is op exacte kandidaat-SHA `3f9a08ca99aa3bac7f4114aa3f180ff2fe1668cd` opnieuw uitgevoerd via https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/43741527569 (completed: SUCCESS).
- Netlify site `1c4fa5ce-45ae-45dc-b3e2-11f90587c474` publiceerde deploy `6af9ec6155a593caa523acbc` op `2026-11-15T17:31:17.791Z`; providerstatus `READY` en `CURRENT`.
- De geïsoleerde GitHub-run bevestigde bronregressies, volledige sitebestandsbackup, publicatie van `/zaalplanner/` plus PWA manifest, service worker en PNG-iconen, en byte-identieke bestaande homepage.
- Lokale mobiele Chromium-interactietest opnieuw uitgevoerd: schermtabs, keeper wisselen, afwezige speler, 6 veldpersonen inclusief keeper, 4 bankzitters, 7 verschillende beginopstellingen, PNG/PDF-downloads, 0 JavaScript-paginafouten.
- Op een iPhone kan de gebruiker de site in Safari via Delen > Zet op beginscherm als zelfstandige PWA openen. **Beperking:** er is nog geen geautomatiseerde interactieve productiebrowserproef tegen de echte Netlify-host; alleen provider-HTTP- en lokale browserproeven zijn aantoonbaar.
- Geen Make gebruikt. De brede repo-PR #5875 blijft open; geslaagde separate sitepublicatie is geen bewijs van een beschermde merge van de hoofdrepository.
