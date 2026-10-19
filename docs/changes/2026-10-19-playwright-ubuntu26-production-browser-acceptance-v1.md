# Productieacceptatie Chromium op Ubuntu 26.04 — structurele correctie

Datum: 19 oktober 2026
Obligation-ID: `production-browser-readback-ubuntu26-20261019`
Release: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4455

## Probleem en klantimpact
De functioneel gepubliceerde Decision Twin van [PR #4452](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4452) werd niet automatisch geaccepteerd in de browser: de drie CI-workflows `Portal V2 Production DOM Readback`, `Production Source Snapshot` en `Production Release Readback` stopten bij de Chromium-installatie. De productiecode zelf was via Netlify al gepubliceerd, maar browserinteractie was niet aangetoond. Dit onderscheid moet behouden blijven.

## Verifieerbare oorzaak
GitHub-hosted Ubuntu `26.04-x64` ondersteunt `playwright@1.55.0` niet. De runner retourneerde driemaal `Playwright does not support chromium on ubuntu26.04-x64`. Officieel ondersteunt Playwright 1.61 Ubuntu 26.04: https://github.com/microsoft/playwright/blob/main/docs/src/release-notes-js.md .

## Oplossing
Vaste versie `1.61.0` in de gedeelde `tools/ci/install-chromium.sh` en **alle drie** bijbehorende productie-workflowaanroepen. De browserinstallatie blijft verplicht en de stappen voor geauthenticeerde browseracceptatie, exacte SHA, immutable Netlify-deploy en beveiliging blijven ongewijzigd. Geen fictieve screenshots of bypass.

## Verifieerbare acceptatie
1. `node --test tests/brain-playwright-ubuntu26-production-readback-v1.test.mjs`, Required CI en CodeQL op dezelfde commit.
2. Beschermde merge; bevestig de productie Netlify-SHA onafhankelijk van browserbewijs.
3. Voer browserinstaller daadwerkelijk uit op Ubuntu 26.04 in Github Actions.
4. Voer geauthenticeerde readback uit tegen de exacte live release, controleer de nieuwe Decision Twin/roadmap interactie.
5. Alleen als deze controles werkelijk slagen, sluit de browserblokker als hersteld. De achterliggende CMS-, klantforecast- en commerciele uitvoeringsverplichtingen blijven afzonderlijk open.
