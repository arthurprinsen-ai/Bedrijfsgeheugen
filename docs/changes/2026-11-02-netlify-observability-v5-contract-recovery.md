# 2 november 2026 — observability publicatiebewijsversie v5 veilig houden

## Onafhankelijke bronwaarneming
Oorspronkelijke volledige BRAIN-run [41416918147](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/41416918147) bevat 28 fouten van 5.377 tests. Eén ervan betreft de originele `tests/brain-netlify-observability-release-parity-20261029.test.mjs`, die nog `social-publication-proof-v2` vereist. De originele Netlify-functie `netlify/functions/powerhouse-observability.mjs` gebruikt echter een op versie vastgezet `PUBLICATION_EVIDENCE_CONTRACT='social-publication-proof-v5'`. De aparte reeds bestaande oorspronkelijke regressie `tests/brain-social-publication-portal-diagnostics-20261029.test.mjs` verwacht dezelfde v5 meerdere keren.

## Oorzaak en veilig herstel
De historische release-parity test loopt achter op een expliciete privacy- en bronbewijscontractversie. Downgrade naar v2 zou de originele afgeschermde bronwaarheid laten vervallen. Daarom alleen de oude test wijzigen: de huidige v5 is verplicht, de bestaande publicatiediagnostiek heeft dezelfde v5 en v2 blijft expliciet verboden. Behoud alle original `isPowerhouseAdmin`, tenantvereisten, `publicationEvidence` contractprojectie, endpointreleaseregels en beveiligde Netlify-deploy. Geen publicatie, retry, CMS-goedkeuring, statusbypass of providercreatie in deze PR.

## Borging
ONE BRAIN incident `powerhouse|brain|netlify-observability-v2-v5-test-drift|20261102-v1`, bestaande social-recovery skill, centrale AGENTS, human changes en append-only ledger worden samen onderhouden. Test deze oorspronkelijke regressie en de dedicated originele securitytest in historische replay, shadow en canary, vervolgens de gehele exact-head BRAIN, Required, CodeQL, beschermde merge, originele Netlify production exact-SHA en geautoriseerde private Portal readback. Ook na merge blijven bestaande 27+ andere fouten en uitgaande providerbewijzen OPEN tot onafhankelijk bewezen. Geen fictief resultaat of omzet.
