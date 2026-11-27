# 20 november 2026 — Innovatie-agent: actuele productie-readback zonder Netlify-secret

## Geconstateerd
De originele engineering/self-evolution-automatisering bevat brongebonden innovatieselectie, een Codex-codevoorstel met geteste PR en onafhankelijk GitHub-mergebeleid. Het oorspronkelijke `innovation-original-delivery-continuity.mjs` kon na een beschermde merge echter alleen de actuele Netlify providerstatus ophalen wanneer `NETLIFY_AUTH_TOKEN` en `NETLIFY_SITE_ID` beschikbaar waren. De read-only originele workflow geeft deze secrets doelbewust niet door. Zonder credentials werd `currentProduction=null`, waardoor nieuw live bewijs niet werd gevonden. Dit is een technische bewijsuitval, geen toestemming om 14 onvoltooide innovaties op groen te zetten.

## Bouw in de bestaande keten
- Voeg `readCanonicalProductionReleaseIdentity()` toe aan de **bestaande** `tools/ci/portal-canonical-browser-release-fence.mjs`, gebaseerd op de bestaande `verifyPortalCanonicalBrowserRelease`.
- Lees het live manifest via `https://www.bedrijfsgeheugen.nl/release.json` zonder secret en met cache-bypass; valideer `contract=BRAIN-DELIVERY-v2`, `context=production`, exact Git SHA en Netlify deploy-ID.
- Hercontroleer hetzelfde SHA en dezelfde deploy-ID onafhankelijk op `https://<deploy-id>--bedrijfsgeheugen.netlify.app/release.json` en opnieuw op de canonieke productiehost.
- Alleen bij deze readback kan de originele Github-compare de oorspronkelijke merge-commit als ancestor bevestigen. Een mislukking blijft nonterminal; het bestaande originele Brain operation-ID, versie-CAS, verplichting en owner blijven behouden.
- Draai de nieuwe positieve/negatieve regressie in de **bestaande** dagelijkse en scoped-recovery job. Agent- en skillinstructies bijgewerkt, geen extra scheduler, agent, permission, token of tabellen.

## Acceptatie en grenzen
De huidige Netlify-projectdeploy op 20 november 2026 heeft via geautoriseerde Netlify project/deploy readback `state=ready`, `context=production`, commit `63894d9e5db0b5b07623030c58825cea473615be` en deploy-ID `6b00ac282c935b1fddd2a38d`. Dit is **voorafgaand bestaand** providerbewijs; niet een deployment van deze PR of bewijs van afgeronde innovatie. Regressies moeten bij verkeerde context, ontbrekende SHA, redirect, HTTP-fout en verschillende immutable/canonieke manifests sluiten zonder false-positive.

Een beschermde PR is kandidaat, geen live release. Closure pas na Required + CodeQL, protected merge, onafhankelijke productie-GET, originele ONE BRAIN CAS-readback, named consumer ACK, Heartbeat effectmeting en later aantoonbare toepassing in agents/skills. De originele 14 innovatieverplichtingen blijven OPEN zolang dit ontbreekt. Rollback: beschermd revert van deze code, zonder rollback of herschrijven van oorspronkelijke operation-/kwaliteitsbewijsdata.

Bestaande oorzaak/acceptatie: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4918 en P0 https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198.
