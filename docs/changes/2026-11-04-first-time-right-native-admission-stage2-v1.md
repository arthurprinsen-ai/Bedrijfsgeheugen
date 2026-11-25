# 4 november 2026 — fase 2: First Time Right verplicht vóór dure GitHub CI

## Bronoorzaak en afhankelijkheid
Na beschermd gemergde PR #5392 (commit `17959aed661eeea0d44b6aa45f441be1e0ba68a4`) bestaan checker, zes historische regressies, alle-agentregels, ONE BRAIN-leerregel en bestaande delivery-skill. De checker was bewust nog niet in oorspronkelijke `hygiene / admission` geladen: de PR die de checker toevoegt mag zijn eigen onbewezen veiligheidsregel niet aanroepen.

## Oorspronkelijke integratie
Dezelfde bestaande `.github/workflows/powerhouse-delivery-hygiene.yml` haalt `currentMainSha` onafhankelijk op van GitHub, haalt uitsluitend díe beschermde `main`-versie van `tools/delivery/first-time-right-prebuild-gate.mjs` op en voert kandidaatbroncontrole uit vóór `evaluateWriterLease` en dure GitHub lanes. Onbekende onveilige bestandslinks, ontbrekende bron, syntaxisfouten, onbalans in dollar-quotes en ontbrekende regressies geven `FIRST_TIME_RIGHT_PREBUILD_BLOCKED`; ieder met een machineleesbaar record `.artifacts/powerhouse-prebuild-evidence.json` plus de oorspronkelijke admission-foutregistratie. Er vindt geen remote provider-create plaats door deze vroege bronpoort.

De bestaande native `.github/workflows/required-test.yml` roept `hygiene` al vóór `preflight` aan en behoeft geen tweede workflow of onveilige wijziging. De voorgestelde aanvullende wijziging daaraan werd niet uitgevoerd wegens veiligheidsblokkade; een gerichte regressie bevestigt juist de bestaande workflowvolgorde.

## Voorwaarden vóór bouwen
Requirements, waarde/meetcriterium, eigenaar/lease, echte bron, incidentgeheugen, security/privacy/consent, providerrechten, kosten, quota, idempotentie, rollback, tests en effectmeting blijven formeel vereist vóór iedere materiële actie. De nieuwe gate automatiseert een **deel** van die voorwaarden. Originele redactie-, auth-, identiteits-, provider- en privacycontroles blijven onafhankelijk gelden; één groene compile is nooit volledig groen.

## Exit / bewijs
Native protected Required/BRAIN, CodeQL, gecontroleerde merge. Daarna echte origineel admission-afwijzing op oude dubbele `const` en geldige acceptatie op veilige bron. Check exact-head artifact (fingerprint, owner, cause, prevention), en bestaande ONE BRAIN incident-ingest + onafhankelijke readback. Zonder test van echte oorspronkelijke GitHub-admission geen productieclaim.

Centrale incidentregistratie: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
