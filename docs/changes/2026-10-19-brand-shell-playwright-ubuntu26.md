# Productie browsercontrole — Ubuntu 26.04

**Obligation-ID:** brand-shell-ubuntu26-playwright-20261019  
**Status:** CANDIDATE; productieacceptatie ontbreekt tot beschermde merge en echte browserrun.

## Reproduceerbaar incident
GitHub `Canonical brand shell live readback` run #39294416171 kon de live shell, SEO- en growth-endpointcontracten voor commit `3404f09a26db4fe1d787ced2eb65dda178b70878` succesvol lezen. Het daaropvolgende installatieonderdeel faalde op GitHub Ubuntu 26.04 met `PLAYWRIGHT_PACKAGE=playwright@1.55.0`: `Playwright does not support chromium on ubuntu26.04-x64`. Drie identieke retries verbeterden dit niet. Er was daardoor geen visueel regressiebewijs; de site zelf is niet op deze oorzaak afgekeurd.

## Exact herstel
Vervang uitsluitend de verouderde workflow-override door `playwright@1.61.0`. De bestaande `tools/ci/install-chromium.sh` gebruikt al versie 1.61.0 als standaard. De upstream Playwright v1.61 bracht Ubuntu 26.04-ondersteuning. Behoud de echte Chromium-, visuele en productiecontroles; geen gefingeerde groene status of exception op browserfalen.

Bron: https://github.com/microsoft/playwright/issues/40117

## Leerregel / preventie
De werkelijke Playwright-versie in iedere browserwerkstroom moet passen bij het actuele GitHub runner OS, en met de repo-installer overeenkomen. Controleer alle expliciete versiepins voordat een generieke apt-retry wordt gestart. Fail closed zolang echte browserbewijs ontbreekt; een geslaagd HTTP- of SEO-contract is geen visuele browseracceptatie. Bestaande owner, geen tweede deploy-scheduler.

## Verplichte acceptatie
Nieuwe Node-regressie, volledige vereiste CI/CodeQL op exact head, beschermde merge en productievisualisatie uitgevoerd met werkelijke Chromium op de geauthenticeerde deployment. Totdien status **CANDIDATE**, niet live.
