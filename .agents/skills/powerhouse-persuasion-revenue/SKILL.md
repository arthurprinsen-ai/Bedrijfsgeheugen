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

## Growth Swarm 20/20 integration
All twenty Growth Swarm plays may consume the canonical Persuasion Revenue Optimizer where a message/value exchange exists. Persuasion remains downstream of play/eligibility selection and upstream of provider execution.

The optimizer may select framing, give asset and minimal get ask, but it may not create an independent contact budget or bypass evidence, consent, identity, dedupe, fatigue, suppression, opt-out, provider capability or provider acknowledgement. Anti-consultancy uses value-first + no-buy autonomy; bounded risk-reduction uses an explicit output condition, never fabricated scarcity or an uncontrolled guarantee. Public demand-generation content may use evidence, contrast and verified aggregate social proof, but never sensitive psychological/personality profiling of prospects.
