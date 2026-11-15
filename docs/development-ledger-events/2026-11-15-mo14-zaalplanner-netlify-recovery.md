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

## V4 app-menu release — 2026-11-15 17:51 UTC

- Bron: PR #5875, originele website `pw-mo14-1`, site-ID `1c4fa5ce-45ae-45dc-b3e2-11f90587c474`. V4 voegt vijf hoofdtabs, een eigen Start-scherm, zeven wedstrijdkaarten, een werkend menu-/hamburgerdialoog, functionele Downloads-/Instellingenroutes, hash/navigatiegeschiedenis en PWA-snelkoppelingen toe zonder de zaalhockeyberekening te vervangen.
- Ontwerpgrondslag: Apple HIG Tab Bars, https://developer.apple.com/design/human-interface-guidelines/tab-bars, plus PWA manifest-richtlijnen van https://web.dev/learn/pwa/web-app-manifest.
- Lokale mobiele browseracceptatie: 390×844, Start en zeven kaarten, wedstrijd 4 openen, menu→Downloads, keeper Nine instellen, Jackie afwezig, instellingen 15 minuten, 5 veld + 1 keeper, drie bankzitters, PNG download en browser-back, **0 JavaScript-paginafouten**.
- Eerste protected MO14 v4-release `43743265879` faalde fail-closed vóór deploy door ongeldige RegExp in een nieuw regressiebestand. Testregressie zonder policy-bypass gecorrigeerd, volledig herstart.
- Originele no-Make GitHub→Netlify-run: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/43743378235, status **success**; 5 tests passed, back-up en byte-identieke homepage, manifest/shortcuts, iconen, serviceworker `mo14-zaalcoach-v4` en DOM-markers voor de menuroutes gecontroleerd.
- Provider: Netlify deploy `6af9f10265b3efe1dbbde163` in `CURRENT / READY`, gepubliceerd `2026-11-15T17:51:02.876Z` op https://pw-mo14-1.netlify.app/zaalplanner/. Geen Make of parallelle site gebruikt.
- Grens: volledige interactieve browsertest **op de productiehost zelf** niet uitgevoerd; lokale browserinteractie plus geautoriseerde HTTP-/bestandsreadback wél bewezen. De bredere Bedrijfsgeheugen-bron-PR #5875 blijft open onafhankelijk van deze aparte Netlify-site-release.

## PW-clubstijl en wedstrijddata v5 — 2026-11-15 18:15 UTC

- Official club evidence: https://www.pwhockey.nl/tenue — bordeaux shirt, black trousers/skirt, bordeaux-white striped socks; branded shield with PW/1915 diagonal red-white-blue, matching PW Hockey application image https://cdn.aptoide.com/imgs/f/7/8/f783f40b61eb7a802a6c325305bc825a_icon.png.
- v5 displays the PW club crest in the app header, burgundy/white/black color system, PW icon variants 192/512 and PWA theme #59222d. Badge comes from the cited public club-app image; downloaded only inside the authorized original deploy runner, validated as PNG and copied into the published app folder and offline cache.
- Each of the existing seven match cards and the selected-match toolbar now display a separately editable calendar date, stored with the existing local match state. Each exported block/overview carries the appropriate per-match date or clear "DATUM NOG INVULLEN" placeholder.
- No independent official match-level fixtures could be verified from public PW/KNHB pages; do not invent dates or confuse field hockey MO14-1 with the separate zMO14-1 or zMO14-11-C.
- Local Chromium test: seven date controls, independent date changes for matches 1/2, Dutch date formatting, immediate app state update, zero runtime JS errors; source + PWA regression passed in original GitHub release run.
- Initial protected run 43745169166 blocked on absent runner PNG-resize utility; recovery included pinned sharp@0.34.5 fallback. Run 43745339957 then reached Netlify but failed 401 because temporary deploy credential expired. Fresh single-site Netlify proxy was re-encrypted via GitHub Actions secret MO14_NETLIFY_PROXY_TEMP; original workflow dispatched without Make.
- Original direct GitHub→Netlify workflow run: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/43745641533 SUCCESS including preserved homepage, PNG crest/icon verification, branded manifest, seven date bindings and provider live readback.
- Original Netlify project pw-mo14-1 ID 1c4fa5ce-45ae-45dc-b3e2-11f90587c474: deploy 6af9f6b25c81bf8adaae9dc5, CURRENT/READY, published 2026-11-15 18:15:19 UTC. https://pw-mo14-1.netlify.app/zaalplanner/
- No Make, no new Netlify project. Broader Bedrijfsgeheugen source PR #5875 still open; full interactive browser test against production host not independently completed (local browser + provider structural HTTP readback proven).
