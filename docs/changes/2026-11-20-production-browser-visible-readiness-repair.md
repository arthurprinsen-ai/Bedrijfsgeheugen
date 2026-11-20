# 20 november 2026 — productie-browser readback houdt zichtbare pagina ten onrechte tegen

## Werkelijk incident

Na beveiligde merge van innovatie-readback PR #6083 bevestigde het bestaande originele Production Release Readback workflow:
- exact live productie SHA `c4dbf300b6b184e94f1f77ab6539a41dc3a0235c`;
- Netlify deploy-ID `6b00c520879fb38200edd113` met `ready` en `context=production`;
- live `release.json` en geauthenticeerde Portal API met 200 en twee geïsoleerde testtenants;
- connector readiness.

Desondanks faalde de originale job op **20 november 2026 om 22:19 UTC** bij `Verify affected production routes` met `page.waitForFunction: Timeout 30000ms exceeded`, locatie `tools/site-shell/verify-targeted-website-routes.mjs:90`. Bron: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/44826573338.

## Bronoorzaak en gecontroleerde correctie

De bestaande Playwright-call `page.waitForFunction(predicate, {timeout:10_000})` gebruikt de tweede parameter als **predicate-argument**, niet als Playwright-opties. De gewenste tien seconden waren daardoor niet afgedwongen: exact de waargenomen dertigseconden-default. Verder eiste het zichtbaarheidspredicaat dat een direct kind van `document.body` een afmeting heeft. App-wrappers met `display:contents` of `0 × 0` kunnen wel werkelijk zichtbare tekstinhoud bevatten en onterecht rood worden.

Wijzig alleen de oorspronkelijke `verify-targeted-website-routes.mjs`: een gedeelde testbare `waitForRenderedBody` gebruikt `page.waitForFunction(predicate,undefined,{timeout:10_000})` en controleert nog altijd `body.innerText`, CSS-display, visibility, opacity en niet-nul geometrie. Alleen wanneer top-level wrappers geen box hebben, wordt zichtbare tekstdragende inhoud in bekende semantische afstammelingen onderzocht. De originele maximaal drie frisse page-retries blijven bestaan; terminal failures loggen nu uitsluitend route, viewportbreedte, poging en foutklasse.

## Borging

`tests/brain-production-route-visible-nested-readiness-20261120.test.mjs` bewijst Playwright-argumentvolgorde en tiensecondenlimiet, echte zichtbare geneste inhoud, negatieve verborgen/doorzichtige/lege gevallen, niet-uitbreidbaar tijdsbudget en behoud van de originele fail-closed browser-workflow. Het originele `.agents/skills/powerhouse-delivery-self-optimization/SKILL.md` bevat de preventieregel. De bestaande compiler draait historische en canary-regressie binnen beschermd GitHub CI. Geen nieuwe scheduler, writer, bypass, credential, provider-send of browser-gate-uitzondering.

De productie-uitrol van de **vorige** PR is bewezen; dit nieuwe browserherstel is pas live na beschermde merge en onafhankelijke natuurlijke productie-controle. Onbewezen uitkomst blijft rood. Alle 14 oorspronkelijke innovatieverplichtingen blijven OPEN totdat hun eigen Heartbeat/consumer-leerbewijs is afgerond.

Oorspronkelijk incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198. Extra borging: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4918.
