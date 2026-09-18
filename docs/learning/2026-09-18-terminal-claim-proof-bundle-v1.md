# Terminal claim proof bundle — 2026-09-18

## Probleem
Een statuszin uit een eerdere chat is geen productie-evidence. Ook een open of niet-gemergede PR, queued/failed CI of een geslaagde deploy-preview bewijst niet zelfstandig dat productie wel of niet is gemuteerd.

## Canonieke regel
Iedere huidige en toekomstige chat, agent, workflow, scheduler of release-worker mag alleen **LIVE_PROVEN / LIVE & BEWEZEN / PRODUCTION_GREEN / FULFILLED** melden wanneer een actuele proof bundle is opgebouwd uit de canonieke authorities.

De bundle bevat minimaal obligation/run/actor, actuele candidate identity of artifact digest, required gates, protected promotion, productie/provider mutation- en readbackreferenties, outcome/value, learning- en prevention-writeback, geraadpleegde authorities en verificatietijd.

## Statussemantiek
- Een gewijzigde PR-head supersedet eerdere exact-head terminal evidence voor de actieve kandidaat.
- Een niet-gemergede PR of CI-status is geen bewijs dat buiten GitHub geen productie-write heeft plaatsgevonden.
- Ontbreekt directe productie/provider-audit evidence, dan is de juiste status **PRODUCTION_WRITE_NOT_VERIFIED**.
- Ontbreekt een ander verplicht bewijsdeel, dan blijft de uitvoering non-terminal en recoverable.
- Iedere terminal-evaluatie wordt als activiteit gelogd, ook wanneer het resultaat nog niet groen is.

## Learning
Fingerprint: `powerhouse-terminal-claim-proof-bundle-v1`.

De preventieregel is onderdeel van de universele agent-learning/writeback policy en de recovery-skill. De regressietest voorkomt dat toekomstige wijzigingen deze verplichting stil verwijderen.
