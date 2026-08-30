# 2026-08-30 — Direct-main TDD + niet-uitgevoerde chat-learning guard

## Type
ERROR → RECOVERY → CONTRACT_CHANGE

## Fingerprints
- `delivery-failure|governance|shared|red-first-test-pushed-directly-to-unprotected-main`
- `delivery-failure|pipeline|shared|classified-change-test-not-executed`

## Symptomen
1. Een RED-first regressietest voor customer-auth learning kwam rechtstreeks op de onbeschermde default branch terecht voordat de bijbehorende knowledge fix bestond.
2. Een bestaande executable chat-recovery regression guard (`tests/delivery-chat-regressions.test.mjs`) was aanwezig, maar `Shared Agent Memory Tests` voerde hem niet uit. Daardoor kon een candidate aanvankelijk groen lijken terwijl de nieuwe direct-main preventieregel ontbrak.

## Impact
- `main` kon tijdelijk rood worden door normale TDD-ontwikkeling.
- Een machineleesbare preventieregel kon verdwijnen of ontbreken zonder dat de centrale shared-memory gate dit zag.
- Parallelle agents konden de fout opnieuw maken zolang native GitHub main protection extern nog niet beschikbaar is.

## Root cause
- GitHub-native `main` protection is nog een externe permission hard boundary; interne discipline was daarom de enige pre-write bescherming.
- De agentcontracttekst beschreef green-candidate promotion maar verbood RED/GREEN development op `main` niet expliciet genoeg.
- Testregistratie en de daadwerkelijke Shared Agent Memory testcommand waren uit elkaar gegroeid: het testbestand bestond wel, maar stond niet in de commandlijst.

## Evidence
- Direct-main RED-first commit: `4cf541ca0c856ab229ff1005a96dfff986ae48c8`.
- Eerste main-push Shared Agent Memory failure: run `33330677111`, 134/135 tests pass; customer-auth production-evidence contract ontbrak.
- Customer-auth recovery later groen: run `33330746687` op SHA `7ad7a88061422056771a7638ff7d5b7ba6a5d9a1`.
- Candidate RED bewijs nadat de vergeten guard echt aan Shared Agent Memory werd toegevoegd: run `33330894299`; failures waren exact de ontbrekende direct-main lesson en expliciete agentregel.

## Mislukte / onveilige aanpakken
- RED-first test rechtstreeks naar `main` pushen en pas daarna de fix maken.
- Aannemen dat een bestaand regressietestbestand automatisch door CI wordt uitgevoerd.
- `main`-push CI behandelen als preventie; het is alleen detectie nadat de default branch al gewijzigd is.

## Definitieve fix
- `tests/delivery-chat-regressions.test.mjs` wordt expliciet uitgevoerd door `Shared Agent Memory Tests`.
- PROVEN lesson toegevoegd aan `docs/brain/delivery-failure-lessons.json`.
- Actieve rule `NEVER_DEVELOP_OR_TDD_DIRECTLY_ON_MAIN` toegevoegd aan `config/delivery-prevention-rules.json`.
- `AGENTS.md` verplicht nu RED/GREEN TDD en alle development mutations op een geïsoleerde candidate branch; alleen groene exact-SHA-promotie via BG169 mag productie-main wijzigen.
- `main`-push CI blijft als post-write detectielaag bestaan, maar is expliciet geen vervanging voor candidate-isolatie.

## Owner agent
`agent-reliability`

## Regression gates
- `tests/delivery-chat-regressions.test.mjs`
- `.github/workflows/shared-agent-memory-tests.yml`
- Unified Brain Delivery / moving-main conflict gate
- BG169 exact-SHA production promotion

## Rollback / last-known-good
Geen rollback van productiecontent vereist; deze wijziging is governance/learning-only. Bij regressie blijft de laatst bewezen production SHA leidend en mag een rode knowledge candidate niet promoveren.

## Herbruikbare les
Een test die niet wordt uitgevoerd bestaat operationeel niet. Iedere nieuwe regressieguard moet zowel geclassificeerd als daadwerkelijk aangeroepen worden door de relevante gate. TDD is per definitie candidate-only: RED mag bewijs zijn, maar nooit de toestand van `main` worden.
