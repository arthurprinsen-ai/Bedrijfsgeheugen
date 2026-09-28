# Skill: Powerhouse Persuasion Revenue Optimizer

Fingerprint: `powerhouse-persuasion-revenue-optimizer-v1`

## Doel
Optimaliseer commerciële communicatie op gerealiseerde omzet zonder dark patterns, gevoelige psychografische profilering of verzonnen bewijs. De optimizer kiest per account, play, funnel-stage en kanaal een evidence-backed message strategy en micro-CTA, waarna bestaande Powerhouse executors de actie uitvoeren.

## Kernregel
Een persuasion decision is nooit terminal delivery. De keten is:
`evidence -> Growth Swarm play -> persuasion decision -> canonical executor -> provider acknowledgement -> outcome -> learning`.

## Toegestane principes
evidence_specificity, reciprocity_value_first, contrast_choice, risk_reduction, social_proof_verified, authority_verified, commitment_micro_step, loss_context, timing_relevance en autonomy_reverse_sell.

## Verboden
Fake scarcity, fabricated social proof, unsupported fear, gevoelige persoonskenmerken of psychologische persoonlijkheidsprofilering, hidden commitment, generieke druk en claims dat geschatte waarde observed impact is.

## Actie-uitvoering
`powerhouse_execute_growth_play_actions_v1(date)` routeert uitvoerbare acties naar bestaande executors:
- email -> `autonomous_email` -> `powerhouse-autonomous-outreach`;
- LinkedIn -> bestaande LinkedIn Sales Machine;
- content/SEO -> `powerhouse_content_recommendations` -> content orchestrator/publicatieketen;
- benchmark/workshop/scan -> bestaande tools/portal;
- onvoldoende evidence -> wait/nurture.

Provider acknowledgement, dedupe, cooldown, suppression en identity gates blijven beslissend.

## Meten
Reply -> meeting -> scan -> paid order -> realized revenue. Een strategy wordt pas winnaar na de measurement floor.

## Runtime authority
`public.powerhouse_persuasion_principles_v1`
`public.powerhouse_persuasion_decisions_v1`
`public.powerhouse_persuasion_revenue_optimizer_v1(...)`
`public.powerhouse_activate_all_growth_plays_v2(date)`
`public.powerhouse_execute_growth_play_actions_v1(date)`
Experiment: `persuasion-revenue-optimizer-v1`
Scheduler-owner: `powerhouse-commercial-learning-v1`.

## Capability truth
Alle 20 Growth Swarm plays zijn runtime ACTIVE. ACTIVE betekent dat er een trigger -> decision -> action/surface -> metric pad bestaat en de play zichzelf kan uitvoeren zodra evidence-gates groen zijn; het betekent niet dat iedere play vandaag genoeg bewijs heeft om extern te handelen.
