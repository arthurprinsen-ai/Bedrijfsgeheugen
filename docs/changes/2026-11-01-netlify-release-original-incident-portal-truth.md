# 1 november 2026 — Powerhouse-incidentstatus naast live productiebewijs

**Originele incidentscope:** #5241 (Netlify `exit 2`), commerciële scope #4198. **Owner:** bestaande Netlify Production Truth / Powerhouse Observability / ONE BRAIN. **Geen tweede scheduler, store of foutregister.**

## Wat onafhankelijk vaststaat
- De oorspronkelijke deployment `6ae79adf878b85f1eb84e757` faalde tijdens de Netlify-build met exitcode 2. De exacte falende bouwfase is niet onafhankelijk bekend uit het provider-metadatasignaal.
- Het latere herstel PR #5242 is beschermd gemerged, en originele Production Source Snapshot #41347008644 heeft de exacte bron `10195dae004485ec728211aeef7151714455988e` op Netlify `6ae7a0e27f3f5dd85bf78b72` **READY** gepubliceerd. De originele prijzen-/taal-browsertests slaagden.
- Toch bleef origineel GitHub-incident #5241 open, met de diagnostic debt van de eerste mislukte volledige build. De portaalkaart onder Delivery & bewijs liet wél bronrelease-status zien, maar niet de actuele originele incidenttoestand. Dit is een **zichtbaarheidsfout**, niet bewijs dat de nieuwe release mislukt is.
- De originele Powerhouse-basisbron van 15 lussen toont op deze controledag 8 groen, 1 oranje en 6 rood. Er is geen onafhankelijke betaalde Mollie-subscriptie/checkout met providerreferentie bewezen.

## Oorzaak → herstel
De bestaande geauthenticeerde `/api/powerhouse-observability` leest al GitHub `main` en productie-`release.json`. Dezelfde begrensde server-read leest nu ook de **oorspronkelijke publieke GitHub-issue #5241**. De pure `brain/observability/original-netlify-incident-readback.mjs` legt een strikte, fail-closed contractvorm vast met open/closed incident, exacte actuele publicatie en `UNVERIFIED_FULL_BUILD_PHASE`. Er worden geen contactgegevens, geheimen, interne ruwe incident-events of providercredentials naar de browser gestuurd.

De bestaande Portal V2 Powerhouse-kaart **Delivery & bewijs** toont het bronincident, laatste officiële update, concrete herstelactie en de volledige originele incidentlink. Een succesvolle nieuwe release **maakt de oude oorzaak niet automatisch groen**. Een ontbrekende GitHub-issue of bronfout blijft `UNVERIFIED`. Geen nieuwe database, statuswriter, cron of onafhankelijke monitor.

## Bewijs en borging
- Tests: `tests/brain-original-netlify-incident-portal-20261101.test.mjs` voor echte issue-id, bronstatus, mismatch, ontbrekende provider, originele adminroute en volledige HTML-URL.
- ONE BRAIN: `brain/learning/2026-11-01-netlify-release-incident-portal-truth-v1.json`.
- Skill: `.agents/skills/powerhouse-netlify-production-truth/SKILL.md`.
- Append-only ontwikkeling: `docs/development-ledger-events/2026-11-01-netlify-release-incident-portal-truth.md`.

**Terminal criteria:** beschermd Required/CodeQL/Netlify-preview → merge → originele productie-snapshot → exacte Netlify provider `READY` en bron SHA → productie UI/browser readback van originele incidentstatus. Het oorspronkelijke incident #5241 blijft open zolang de eerste foutfase/oorzaak niet onafhankelijk opgelost is. Commerciële lus #4198 blijft open totdat een echte klantbetaling providerbewezen is. Geen garantie dat nooit meer fouten optreden: detectie, bewijs, bronherstel en regressie zijn wel verplicht.
