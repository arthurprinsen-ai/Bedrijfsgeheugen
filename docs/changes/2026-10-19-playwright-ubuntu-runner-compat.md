# Productie-browsertests: ondersteunde Playwright-runner — 19 oktober 2026

## Meetbaar defect
GitHub Actions `ubuntu-latest` heeft Ubuntu 26.04 beschikbaar gemaakt, terwijl `@playwright/test@1.55.0` de browser-installatie met `Playwright does not support chromium on ubuntu26.04-x64` weigert. Bij [run #39216880329](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39216880329) gebeurde dit vóór een enkele portaalinteractie. De portaalcode werd daardoor ten onrechte niet browsergecontroleerd, ook wanneer een Netlify-deploy al correct was.

## Oplossing en preventie
De zeven bestaande workflows die `tools/ci/install-chromium.sh` gebruiken, zijn op `ubuntu-24.04` vastgezet. De regressietest `tests/brain-playwright-supported-runner-v1.test.mjs` controleert alle vijf op een vaste, ondersteunde runner in plaats van `ubuntu-latest`. De browserinstallatie, DOM-tests, beveiligingschecks en readback blijven verplicht. Er is niets groen geforceerd.

**Vervolg:** bij een latere Playwright-upgrade eerst de ondersteunde runner/OS-matrix en browserinstallatie op een afzonderlijke PR verifiëren, daarna pas bewust het OS wijzigen. GitHub-publicatie vereist nog steeds Required CI + CodeQL + beschermde merge, gevolgd door een daadwerkelijk geslaagde browsercheck voor de exacte productiebron.

## Afbakening
Dit herstelt de verificatie-infrastructuur en voert geen nieuwe tenantdata, content of externe acties uit. De Decision Twin-feature in PR #4452 is afzonderlijk gebouwd; het oorspronkelijke Netlify-deploycommit `d3a73d8816c384c6a745b68178b4691727d31000` is provider-READY, maar de browsercontrole daarvoor vereist deze runnerreparatie. Geen claim van eindacceptatie vóór browserbewijs.
