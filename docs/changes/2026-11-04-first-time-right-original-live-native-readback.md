# 4 november 2026 — First Time Right is aantoonbaar live en teruggelezen

De originele native GitHub-toelating staat nu op de beschermde hoofdbranch en heeft een echte negatieve én positieve controle doorstaan. Het oorspronkelijke bronincident was de dubbele `const revisionInput` die Supabase Edge-worker v601 eerder liet stranden met HTTP503.

## Onafhankelijke bewijzen
- **Release fase 1:** PR #5392, beschermde merge `17959aed661eeea0d44b6aa45f441be1e0ba68a4`. Checker, zes regressies, ONE BRAIN leren en alle-agentregels op main.
- **Release fase 2:** PR #5393, beschermde merge `feb1635b374ed93a5fdacdc498eeefc8b596eb26`. Dezelfde native `hygiene / admission` laadt checker van de onafhankelijk vastgestelde beschermde main-SHA, niet kandidaatcode.
- **NEGATIEF, echte GitHub Actions-run:** test-PR #5397, run 41797450956, job 126464797844, kandidaat `4486b8a`: `FIRST_TIME_RIGHT_PREBUILD_BLOCKED:MODULE_SYNTAX_REJECTED`, met identieke `revisionInput`-SyntaxError. De oorspronkelijke toelating bleef dicht vóór dure bouw en schreef fingerprint, root cause, owner, bron, preventie, regresstest en providerverbod.
- **POSITIEF na herstel van dezelfde test-PR:** run 41797567508, job 126465189368, HEAD `c81fde8`: `FIRST_TIME_RIGHT_PREBUILD_READY`, `ADMITTED`, `CANONICAL_INTEGRATION_CLOSURE_COMPLETE`.
- **Geen proefcode live:** PR #5397 is gesloten zonder merge.
- **Canoniek ONE BRAIN-readback:** exact één `public.brain_failure_occurrences` voor `powerhouse|prebuild|module_syntax_rejected`, occurrence ID gekoppeld aan GitHub-run 41797450956. Schrijver is de oorspronkelijke `brain_observe_failure`; `is_synthetic=true` en `CANARY_PASS_NEGATIVE_AND_POSITIVE_VERIFIED`. Dubbele incidentele productieblokkade is niet aangemaakt. Zie issue #4198 comment 6625978999.

## Belangrijke grenzen
Dit bewijst de **specifieke vroege JS/TS-syntaxiscontrole plus oorspronkelijke admission**. De regels voor SQL-dollarquote en minimaal één gewijzigde regressietest zijn gedekt door de lokale en beschermde tests, niet afzonderlijk met een echte foutieve native SQL-PR. Externe providerfouten, niet-geautoriseerde acties en onbekende oorzaken kunnen nog optreden. Het automatisch doorzetten van toekomstige GitHub CI-fouten naar ONE BRAIN is nog **NIET ONPARTIJDIG LIVE BEWEZEN**: deze ene gecontroleerde canary werd bewust rechtstreeks via de bestaande idempotente `brain_observe_failure` vastgelegd. De originele incident-ingester moet die toekomstige dekking nog autonoom aantonen.

Geen willekeurig groen of belofte van nul fouten. Alle overige Powerhouse-incidenten en commercieel onvoltooide publicaties behouden hun oorspronkelijke eigenaren, authenticatie, duplicate/identity-vereisten en onafhankelijke outcome readback.

Centrale originele incidentregistratie: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
