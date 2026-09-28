# Skill: Powerhouse Growth Swarm

Fingerprint: `powerhouse-growth-swarm-v1`

## Doel
Maak alle commerciële Powerhouse-intelligentie onderdeel van één revenue-first operating system. Geen losse growth hacks, losse contentmachine, losse outreach-stack of parallel CRM. Iedere play gebruikt dezelfde canonical relationships, public research, scans, benchmarks, opportunities, content recommendations, actions, outcomes en learning.

## North star
Eerst betaalde order, daarna gerealiseerde omzet. Bereik, likes, comments, traffic, scans en meetings zijn tussenstappen tenzij ze aantoonbaar leiden tot commerciële uitkomst.

## Canonieke keten
public/first-party evidence -> relationship/company intelligence -> trigger/problem hypothesis -> dark-funnel intent -> friction/knowledge/M&A risk -> expected-value hypothesis -> Growth Swarm score -> play selection -> next-best-action/channel -> execution -> provider/readback -> outcome -> learning -> volgende scoring.

## 20 canonieke growth plays
1. `mkb-friction-index` — geanonimiseerde sectorfrictie als benchmark, content en scan-ingang.
2. `prebuilt-prospect-dossier` — vóór contact al 3 observaties, 2 hefbomen, economische hypothese en volgende actie.
3. `positive-public-teardown` — publieke, behulpzame analyse van wat een bedrijf goed doet en waar publieke evidence nog ruimte toont.
4. `anti-consultancy-challenge` — waarde aantonen vóór verkoopdruk; geen loze garantie.
5. `reverse-selling` — bij lage fit of onvoldoende bewijs expliciet adviseren nog niet te kopen.
6. `trigger-hijacking` — verse bedrijfsgebeurtenis direct vertalen naar relevante contextuele actie.
7. `boardroom-fear-of-blindness` — directievragen over wat men vandaag niet weet maar bestuurlijk moet weten.
8. `lost-knowledge-calculator` — scenario-inschatting van kennisverlies; altijd als estimate gelabeld.
9. `value-before-demo` — economische hypothese vóór demo/scan, nooit als observed fact presenteren.
10. `prospect-generated-content-loop` — herhaalde prospectproblemen worden geanonimiseerde content; engagement voedt weer de intelligence.
11. `competitor-switch-pages` — SEO op concrete problemen/overstapintentie, altijd canonical-owner/cannibalization-first.
12. `ma-knowledge-risk` — Knowledge & Execution Risk voor investeerders/M&A/portfolio's.
13. `competitor-benchmark` — alleen publieke/aggregate vergelijking; geen gefabriceerde interne concurrentiedata.
14. `data-contribution-flywheel` — diepere benchmark na expliciet consent voor geanonimiseerde bijdrage.
15. `warm-referral` — na echte positieve outcome één specifieke warme intro vragen in plaats van generiek referral-programma.
16. `risk-reversal` — alleen conditioneel en evidence-backed; nooit een onbeperkte commerciële garantie.
17. `workshop-leaderboard` — anonieme workshop-percentielen + portal handoff; minimaal 5 deelnemers.
18. `dark-funnel` — zwakke signalen op accountniveau combineren; één weak signal is nooit koopintentie.
19. `we-disagree-content` — contrarian content alleen met bewijsbare claim.
20. `revenue-swarm` — dagelijkse orkestrator die accounts rangschikt, play/kanaal kiest, uitvoert of bewust wacht en daarvan leert.

## Runtime authority
- Account state: `public.powerhouse_growth_swarm_accounts_v1`.
- Revenue ranking: `public.powerhouse_revenue_swarm_v1`.
- Dark funnel: `public.powerhouse_dark_funnel_intent_v1`.
- Friction index: `public.powerhouse_friction_index_v1`.
- Workshop benchmark: `public.powerhouse_workshop_leaderboard_v1`.
- Lost knowledge: `public.powerhouse_lost_knowledge_value_v1(...)`.
- M&A risk: `public.powerhouse_ma_knowledge_execution_risk_v1(...)`.
- Refresh: `public.powerhouse_refresh_growth_swarm_v1(date)`.
- Materialization: `public.powerhouse_materialize_growth_swarm_v1(date)`.
- Public safe tools: Edge Function `powerhouse-growth-tools`.
- Catalog: `public.powerhouse_growth_play_catalog_v1` and `config/powerhouse-growth-swarm-playbook-v1.json`.
- Single scheduler-owner remains `powerhouse-commercial-learning-v1` through the existing commercial cycle.

## Revenue Swarm scoring
Score combines relationship strength, fresh trigger evidence, dark-funnel convergence, friction, knowledge/M&A risk and economic evidence. The score prioritizes work; it does not prove buying intent or revenue.

A company can receive `expected_value_eur=2900` as an entry-offer hypothesis only when fresh trigger + relationship gates pass. This remains a commercial hypothesis until an actual order/payment exists.

## Execution
- `swarm_score >= 0.35` can produce a prebuilt internal dossier.
- External action still flows through existing LinkedIn/email engines and their identity, dedupe, fatigue, suppression and provider-ack gates.
- Public content receives anonymized aggregate evidence only.
- Referral actions are internal until context is validated.
- If evidence is insufficient, the valid action is research/wait, not fabricated urgency.

## Public growth tools
`powerhouse-growth-tools` exposes only safe surfaces:
- friction-index / competitor-benchmark: aggregate groups only;
- lost-knowledge: stateless scenario calculation;
- ma-risk: stateless estimated risk;
- workshop-benchmark: no participant identity;
- revenue-swarm: private token required.

## Privacy and truth
- No personal names or private relationship facts in public content.
- Workshop/benchmark public groups require minimum sample size 5.
- External evidence is context until tenant relevance is proven.
- Financial impact labels: OBSERVED, ESTIMATED, POTENTIAL or SCENARIO_ESTIMATE.
- M&A risk is not a valuation, legal opinion or transaction recommendation.
- No fake competitor intelligence, no fake intent, no fake benchmark.

## Learning
Every play must map to one or more terminal outcomes:
reply -> meeting -> scan -> proposal -> paid order -> realized revenue.

Use `powerhouse_experiment_assignments` / effect-estimate infrastructure when sample sizes permit causal comparison. Do not promote a winning play before its measurement floor is met.


## Terminal production proof — 28 september 2026
Status: `LIVE_PROVEN`.

PR #3182 is merged to protected main at `ce0e18df0876a38be2ce6ce83964b2a274c9b150`. Production readback confirms:
- 20 canonical growth plays;
- 13 runtime-active plays;
- 17.034 accounts in the Growth Swarm state;
- 8 prebuilt prospect dossiers;
- 8 ranked play-events;
- exactly one canonical commercial scheduler and zero parallel Growth Swarm schedulers;
- Growth Swarm refresh + materialization are both wired into the canonical commercial cycle;
- `powerhouse-growth-tools` ACTIVE v4.

Plays that lack enough real data stay ARMED/READY_FOR_SURFACE rather than inventing benchmark or intent evidence.


## Persuasion Revenue Optimizer
Fingerprint: `powerhouse-persuasion-revenue-optimizer-v1`.

Every prepared private outreach action is eligible for one final value-exchange optimization before provider dispatch:
- choose an evidence-bounded persuasion strategy;
- choose one concrete give asset;
- choose the smallest reasonable get ask;
- preserve identity, consent, dedupe, fatigue, suppression and provider-capability gates;
- write strategy metadata into the canonical sales action;
- evaluate strategy against reply -> meeting -> scan -> proposal -> paid order -> realized revenue.

The optimizer may improve framing but may not create extra send volume, fabricate urgency/scarcity/social proof, or turn public LinkedIn comments into sales pitches.


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

## Superseding execution proof — all 20 plays v3
Fingerprint: `powerhouse-all-20-growth-plays-v3`.

The historical 13-active state is superseded. A play is built only when the execution authority records trigger owner, executor, surface, outcome metric, truth/privacy gate and `execution_complete=true`.

Runtime authorities: `public.powerhouse_growth_play_execution_contract_v1`, `public.powerhouse_growth_play_build_status_v1`, `public.powerhouse_activate_remaining_growth_plays_v3(date)`, and `public.powerhouse_promote_growth_play_emails_v1(date)`.

Current production runtime readback: **20 catalog plays / 20 ACTIVE / 20 BUILT_ACTIVE**. Growth-play e-mails share the existing five-per-day autonomous-email budget. Benchmark contribution requires separate optional consent. ACTIVE means executable when evidence gates pass; it does not force an external action every run.
