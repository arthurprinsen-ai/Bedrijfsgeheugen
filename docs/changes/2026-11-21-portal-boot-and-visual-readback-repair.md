# 21 november 2026 — echte Portal V2-opstart, browsercontrole en visuele CLS-diagnose

## Providerfeiten vóór de reparatie

Op 20 november 2026 (UTC) publiceerde Netlify exact `c0f712b7f1fde4a99460ec049ec4e55e4ef70257`, production deploy `6b00d10471129b09a539b30f`, state READY. De oorspronkelijke native `production-release-readback.yml` https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/44833465589 bevestigde de exacte deploy, signed Portal-API HTTP 200, tenant-isolatie (2) en connector readiness, maar faalde vervolgens op zichtbare Portal V2-route bij 390 en 1440 pixels: `VISIBLE_READINESS_TIMEOUT` op `/portal-v2/`. De native `canonical-brand-shell-live-readback.yml` https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/44831421618 had 291 publieke pagina's × 3 viewports = 873 zichtbaarheidschecks groen, maar de aparte 7-viewport visuele kwaliteitscontrole faalde terecht op `/due-diligence phone initial: cls`.

**Afgrenzing:** de precieze oorzaak van de ontbrekende portaalmodule-montage, en welk DOM-element mobiel verschuift, zijn nog niet onafhankelijk bewezen. Daarom geen cosmetische testversoepeling, geen fake live-eindstatus en geen speculatieve CSS-hotfix.

## Native bronreparatie

- De bestaande Portal V2 parser-time `v2-hydrating` bescherming blijft actief; `portal-v2/portal-boot-watchdog.js` wordt los van de grote ES-modulegrafiek als eigen, uitgestelde, lokale classic script geladen. Wanneer `app.js` 15 seconden na DOMContentLoaded niet daadwerkelijk de router, navigatie en knoppen heeft gemonteerd, verschijnt een duidelijk herstelpaneel met een expliciete reload-actie en zonder private data of automatisch providerwerk. De oude app blijft tijdens deze fout verborgen.
- `portal-v2/app.js` geeft pas ná echte UI-montage de `bgPortalAppBoot=ready` marker en ruimt een eerdere herstelmelding op. Dat is **geen** geauthenticeerde tenant-, Brain- of financiële succes-ACK.
- `tools/site-shell/verify-targeted-website-routes.mjs` vereist apart voor de echte route `/portal-v2/` echte app-montage, verdwenen hydratatieklasse en géén watchdog-foutpaneel. De wachttermijn is begrensd op 25 seconden, met de bestaande drie afzonderlijke routepogingen. Op timeout worden alleen openbare diagnostische flags en fouttellingen gelogd; niet het tenant-DOM, e-mailadressen of auth-tokens.
- De originele `tools/site-shell/ui-visual-regression/browser-check.mjs` blijft bij CLS boven 0,1 HARD RED, maar geeft nu maximaal vijf public route+viewport+layout-shift selector/geometrie-entries in de bestaande joblog. Daarmee kan de oorspronkelijke agent de werkelijke layoutbron herstellen.

## Beveiligde acceptatie

Regressie: `tests/brain-portal-live-boot-recovery-20261121.test.mjs`; machine-readable legacy/shadow/canary-leerrecord in `brain/learning/2026-11-21-portal-native-boot-and-cls-diagnostic-v1.json`; originele twee agent-skills bijgewerkt. Alleen Required + CodeQL + veilige protected squash + nieuwe exacte Netlify READY + originele volledige productie-readback + geslaagde CLS-regressie mogen groen verklaren. Extern leveranciersconsent, tenantdata, 14 OPEN innovatieverplichtingen en onafhankelijke businessuitkomsten blijven onveranderd.

Rollback: zelfde protected revert; niet rechtstreeks op main schrijven. Iedere vervolgfix aan werkelijk module-asset of verschuivend CSS-element moet dezelfde originele incident-fingerprint en de onafhankelijke readback behouden.
