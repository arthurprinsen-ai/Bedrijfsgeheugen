# 2026-08-30 — Direct-main TDD + niet-uitgevoerde chat-learning guard

## Type
ERROR → RECOVERY → CONTRACT_CHANGE

## Fingerprints
- `delivery-failure|governance|shared|red-first-test-pushed-directly-to-unprotected-main`
- `delivery-failure|pipeline|shared|classified-change-test-not-executed`

## Symptomen
1. Een RED-first regressietest voor customer-auth learning kwam rechtstreeks op de onbeschermde default branch terecht voordat de matching knowledge fix bestond.
2. `tests/delivery-chat-regressions.test.mjs` bestond, maar Shared Agent Memory voerde hem niet uit.

## Root cause
- Native GitHub main protection is nog niet actief; after-the-fact CI was daardoor ten onrechte voldoende geacht als bescherming.
- Testregistratie en de daadwerkelijke Shared Agent Memory testcommand waren uit elkaar gegroeid.

## Evidence
- direct-main RED-first commit: `4cf541ca0c856ab229ff1005a96dfff986ae48c8`;
- main-push failure: run `33330677111`;
- customer-auth recovery green: run `33330746687` op `7ad7a88061422056771a7638ff7d5b7ba6a5d9a1`;
- isolated candidate RED: run `33330894299` nadat de vergeten guard echt werd uitgevoerd;
- isolated candidate GREEN: run `33331155544` op `e81f0b86b94361e5036a7a7ab5d8239d818cdb88`;
- PR #594 werd terecht niet geforceerd toen moving-main echte overlap detecteerde op Shared Agent Memory en het agentcontract.

## Definitieve fix
- PROVEN lesson `red-first-test-pushed-directly-to-unprotected-main`;
- actieve rule `NEVER_DEVELOP_OR_TDD_DIRECTLY_ON_MAIN`;
- `tests/delivery-chat-regressions.test.mjs` draait voortaan werkelijk in Shared Agent Memory;
- de bestaande `BRAIN-CHAT-LEARNING-v1` preflight leest de canonical lesson/rule sources vóór nieuwe agentuitvoering;
- RED/GREEN TDD blijft candidate-only; productie-main wordt uitsluitend via de canonieke exact-SHA promotieautoriteit bijgewerkt.

## Herbruikbare les
Een test die CI niet werkelijk uitvoert bestaat operationeel niet. RED is bewijs op een candidate, nooit een toegestane toestand van `main`. Bij echte moving-main overlap wordt niet geforceerd maar vanaf actuele main gereconcilieerd, met behoud van parallelle verbeteringen.
