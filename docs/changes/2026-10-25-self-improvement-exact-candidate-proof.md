# 25 oktober 2026 — Self-Improvement mag niet groen worden door een ander record

Canonieke parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
Fingerprint: self-improvement|quality-ready-masks-unmeasured-candidate|20261025-v1
Delivery-lane: backend
Obligation-ID: brain:self-improvement:exact-candidate-promotion-proof:20261025-v1

## Onafhankelijke productie-observatie

Op 25 oktober toont de beveiligde Supabase view self_improvement_state=READY_FOR_CONTROLLED_PROMOTION, candidate_total=9 en candidate_measured=0. Van de bestaande learning compiler zijn **9 READY-records van source_type=quality_event** en **9 EVIDENCE_PENDING-records van source_type=optimization_candidate**. De closure authority geeft voor alle negen kandidaten independent_observations=0, review_proven=false, delivery_proven=false, learning_proven=false en observed_cycle_verified=false. De huidige SQL kiest de algemene compiler_ready teller, die ten onrechte kwaliteitsbewijzen van andere objecten als kandidaat-gereedheid gebruikt.

De bestaande groeilus is op 25 oktober nog 'degraded'; 837 open opportunities, de bestaande omzetwaarheid bevestigt nul gerealiseerde en nul geattribueerde euro's. De dagelijkse Self-Improvement en Compound-Learning crons slaagden als transport, maar dat is geen onafhankelijk bewijs van verbetering.

## Minimale gerichte correctie

De bestaande security_invoker view behoudt exact dezelfde kolommen en wordt alleen met een striktere interne candidate_state uitgebreid. De nieuwe candidate_ready teller vereist bij **dezelfde candidate_id** de READY compilerstatus van een optimization_candidate en onafhankelijke observaties, review, delivery, learning en verified cycle. De bestaande status READY_FOR_CONTROLLED_PROMOTION volgt niet langer uit een willekeurige quality_event. De bestaande 9 quality_event regels blijven onveranderd voor hun eigen doel; niets wordt verwijderd, als green gedwongen of op nul gefingeerd.

Geen extra cron, durable queue, nieuwe agents, onbevoegd providerwerk, productie-self-rewrite, betaalde capaciteit of wijzigingen aan klantdata/RLS. De bestaande service_role-only toegang blijft gehandhaafd.

## Verwachte controle en vervolg

De read-only preview select moet candidate_ready=0 en de status LEARNING voorspellen. Een cron 'succeeded' blijft gescheiden van daadwerkelijke outcome. De nieuwe regressie in tests/brain-self-improvement-layer-v1.test.mjs bewijst de exact-ID-selectie en security. Na protected merge pas Supabase migratie/readback, controle van volgende reële leercyclus, geverifieerde commerciële metingen en System Map/Brain status. Zonder dit bewijs blijft de nieuwe toestand CANDIDATE_NOT_LIVE en de brede omzetlus non-green.

De onderliggende nul gemeten groei, 837 opportunities en vertraagde omzetfeedback worden beheerd onder bestaand P0 issue #4198; deze PR beweert geen extra orders of gerealiseerde omzet.
