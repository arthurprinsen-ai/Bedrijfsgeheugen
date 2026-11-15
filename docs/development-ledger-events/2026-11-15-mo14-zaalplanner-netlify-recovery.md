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
