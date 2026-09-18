# Powerhouse Daily Self Evolution v1

## Doel
Powerhouse verbetert iedere dag aantoonbaar de manier waarop chats, agents, skills en delivery samenwerken: sneller, slimmer, betrouwbaarder en eenvoudiger.

## Canonieke regel
Dit is geen tweede Brain of parallelle verbeterqueue. De laag breidt de bestaande Continuous Improvement Engine, Autonomous Improvement Runtime en BRAIN Chat Learning uit.

Iedere dag wordt de actuele state gelezen en worden chats, agents, skills en delivery als capabilities gemeten. Een wijziging wordt alleen kandidaat als er een meetbare hypothese en baseline is. Promotie vereist representatieve evals, regressie-non-degradation, exact-candidate identity, rollback en productie-readback.

Geen wijziging is ook een geldige uitkomst wanneer de huidige champion nog aantoonbaar beter is. Daardoor ontstaat geen nutteloze churn.

## Scope
- alle bestaande en toekomstige chats;
- alle bestaande en toekomstige agents;
- alle skills en skill-achtige policies/scripts;
- alle materiële workflows en delivery-lanes.

## Dagelijkse loop
EXISTING_STATE_FIRST → OBSERVE → MEASURE → CLUSTER → HYPOTHESIZE → BASELINE → CANDIDATE → EVAL → SHADOW/CANARY → PROMOTE/ROLLBACK → PRODUCTION_READBACK → OUTCOME/VALUE → LEARNING_WRITEBACK → PREVENTION_UPDATE.

## Grenzen
Secrets, nieuwe permissies, security-verzwakking, destructieve/onherroepelijke datawijzigingen, hogere betaalde capaciteit en juridische/financiële verplichtingen blijven HARD_BOUNDARY.

## Status
Tot protected merge en main/runtime-readback is de status `RECORDED_PENDING_FINAL_DELIVERY_READBACK`. Daarna mag de lineage uitsluitend `LIVE_BEWEZEN` heten als dezelfde exacte head de vereiste gates heeft doorlopen en op main is teruggelezen.
