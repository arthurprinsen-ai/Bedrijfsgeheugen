# Skill: Powerhouse Persuasion Revenue Optimizer

Fingerprint: `powerhouse-persuasion-revenue-optimizer-v1`

## Doel
Maak persuasion, give/get en next-best-action onderdeel van de bestaande Growth Swarm. Geen losse sequence-tool, geen parallel CRM en geen extra spamvolume.

## Canonieke keten
signal -> Growth Swarm -> prepared sales action -> persuasion strategy -> give asset -> minimal get ask -> provider execution -> outcome -> strategy performance -> next run.

## Strategieën
- reciprocity_value_first
- authority_evidence
- social_proof_peer
- loss_aversion
- commitment_microstep
- contrast_before_after
- curiosity_gap
- reverse_sell

## Give/Get
Geef eerst iets dat direct bruikbaar is: twee observaties, drie hefbomen, mini-benchmark, evidence teardown, knowledge-risk case of board one-pager. Vraag daarna alleen de kleinste logische vervolgstap.

## Hard gates
- Nooit bewijs, klantclaims, schaarste, urgentie of financieel effect verzinnen.
- Schattingen blijven ESTIMATED/POTENTIAL/SCENARIO_ESTIMATE.
- Bestaande identity, suppression, dedupe, fatigue, opt-out en provider-ack gates blijven leidend.
- Geen extra verzendvolume door de optimizer; alleen optimalisatie van reeds toegestane prepared actions.
- Publieke LinkedIn-comments: waarde toevoegen, geen pitch, geen afspraak-CTA.
- LinkedIn DM/like alleen uitvoeren wanneer provider-capability dit expliciet ondersteunt; anders geldige fallback gebruiken.
- Geen promotion van een persuasion-strategie op basis van likes/open rates alleen. Terminale leerketen: reply -> meeting -> scan -> proposal -> paid order -> realized revenue.

## Runtime
- Catalog: `public.powerhouse_persuasion_play_catalog_v1`
- Next best action: `public.powerhouse_persuasion_next_best_action_v1`
- Performance: `public.powerhouse_persuasion_strategy_performance_v1`
- Optimizer: `public.powerhouse_optimize_prepared_outreach_v1(date)`
- Canonieke owner blijft `powerhouse_trigger_based_mkb_acquisition_cycle_v1`.

## Dagelijkse learning
Elke run hergebruikt echte outcomes uit `powerhouse_sales_outcomes`. Strategieën worden pas bevoordeeld als er voldoende terminale uitkomsten zijn. Zonder voldoende bewijs blijft de heuristische selectie actief en wordt geen causaliteit geclaimd.

## Productiestaat — 28 september 2026
De migratie is toegepast op Supabase project `adhjwmvyoixzjtmiroln`. De catalogus bevat 8 strategieën. Een gecontroleerde readback heeft bestaande prepared autonomous-email en LinkedIn-commentacties voorzien van persuasion metadata zonder extra actievolume te creëren.


## Autonomous sales asset execution
Fingerprint: `powerhouse-autonomous-sales-asset-execution-v1`.

A Powerhouse decision is an executable obligation, not a recommendation. The owning agent completes the whole chain itself:
- e-mail -> write final copy, create required attachment, send through the authorized provider, capture provider acknowledgement and outcome;
- LinkedIn/company post -> generate unique final copy/media, publish through the canonical provider, read back and record outcome;
- public comment -> generate the contextual final comment and publish it; never stop at a suggestion;
- DM -> use the authorized DM capability when verified. If the provider cannot DM, automatically route to the highest-ranked executable fallback rather than stop;
- PDF/one-pager/benchmark/evidence dossier -> generate the actual document first, then attach or link it to the selected delivery action;
- visual/reel/carousel -> generate the actual media before publication through the canonical identity.

Draft, suggestion, CTA recommendation, asset recommendation and TODO are non-terminal states. Terminal commercial execution is: materialize -> provider execute -> provider ack/readback -> sales outcome -> learning.

### PDF execution rule
`asset_format=pdf` is authoritative. `board_one_pager`, `evidence_teardown`, `lost_knowledge_case`, `friction_business_case`, `mini_benchmark` and `peer_benchmark` default to PDF. The autonomous Gmail executor generates the PDF with the approved text-to-PDF provider and attaches it to the same outgoing e-mail before sending. Missing facts remain unknown; never invent evidence, ROI, benchmark values, urgency, scarcity or customer proof.

This rule is inherited by chats, agents, scheduled runs, Growth Swarm, LinkedIn sales, autonomous outreach and future commercial agents. Human intervention is reserved for missing authority/credentials, safety/legal boundaries or an irreducible business choice.


## 20/20 Growth Play execution
De Persuasion Revenue Optimizer is onderdeel van execution, niet een advieslaag. Alle 20 Growth Swarm plays hebben een canonical trigger -> decision -> executor/surface -> outcome pad.

De zeven eerder niet volledig uitvoerbare plays zijn geactiveerd:
- MKB Friction Index;
- Positive Public Teardown;
- Anti-consultancy Challenge;
- Boardroom Blindness;
- Problem/Competitor Switch Pages;
- Benchmark Data Contribution Flywheel;
- Conditional Risk Reversal.

`powerhouse_activate_all_growth_plays_v2(date)` maakt de play uitvoerbaar zodra evidence-gates slagen. `powerhouse_execute_growth_play_actions_v1(date)` routeert naar bestaande email-, LinkedIn-, content/SEO-, benchmark-, scan- of portalexecutors. Daarna blijft `powerhouse_optimize_prepared_outreach_v1(date)` de bestaande give/get en boodschap optimaliseren vóór provider execution.

Een optimizer-output, draft, recommendation of score is nooit terminal. Terminal is provider execution/readback of bewust wait/nurture omdat gates niet slagen.

Persuasion mag bedrijfscontext, rol, funnelstage en geverifieerde relatie-/triggerdata gebruiken. Gevoelige persoonskenmerken en psychologische persoonlijkheidsprofilering zijn verboden. Fake scarcity, nep-social-proof, unsupported fear en hidden commitment zijn harde verboden.

## 20/20 terminal proof — 28 september 2026
Status: `LIVE_PROVEN`.
The Growth Swarm 20/20 extension is merged through PR #3207 at `46739777d0a5563001a3520e046a29a57b0b9ec8`. Production readback confirms 20/20 executable plays and 8 active persuasion decisions. The Persuasion Revenue Optimizer remains in the canonical chain before provider execution and is measured on terminal commercial outcomes rather than activity volume.


## Behavioral landing-page revenue optimization
Fingerprint: `powerhouse-behavioral-landing-revenue-v2`.

Commercial website pages are an execution surface of the same Powerhouse Growth Swarm and Persuasion Revenue Optimizer; never create a parallel CRO stack. Powerhouse may autonomously choose hero/message match, CTA hierarchy, proof order, objection handling, risk reversal, section order, progressive disclosure and scan-versus-conversation routing from intent, funnel stage and measured outcomes.

Use Cialdini, loss aversion/prospect theory, Fogg, Hick-Hyman, cognitive fluency, commitment ladders, specificity and choice architecture only within truth/evidence guardrails. Optimize in this order: realized revenue -> paid orders -> qualified proposals -> qualified meetings -> qualified leads -> CTA progression -> engagement. Raw clicks, scroll depth and time-on-page are never standalone winner criteria.

All changes flow through `config/seo-growth-loop.json`, `config/seo-optimization-allowlist.json`, protected delivery, production readback and outcome learning. Maximum three reversible high-confidence changes per daily cycle. Roll back on trust, accessibility, mobile-readability or qualified-conversion regression. Fake scarcity, fake urgency, fake social proof, hidden costs, confirmshaming and preselected consent are forbidden.
