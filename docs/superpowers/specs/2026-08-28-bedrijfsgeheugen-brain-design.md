# Bedrijfsgeheugen Brain — Design Specification

Date: 2026-08-28
Status: Design approved in conversation; implementation not yet started
Scope: Architectural design for the Bedrijfsgeheugen self-improving business operating brain

## 1. Purpose

Bedrijfsgeheugen must operate as one coordinated, self-improving business system rather than a collection of independent Make scenarios, agents, channel automations and dashboards. All usable internal and external data should contribute to one shared world model. That shared state should drive the next best action across sales, market intelligence, SEO, content, creative, website, product, operations, security, cost and production.

The target loop is:

`Sources -> Datahub -> Knowledge Graph -> Signal Engine -> Opportunity Graph -> Decision Fabric -> Mission Queue -> Agent Teams -> Actions/Production -> Outcomes -> Learning -> Memory -> improved Decision Fabric`

Security, governance, cost, QA, observability and production authority operate across the entire loop.

The design deliberately reuses the existing Powerhouse. Existing stable scenarios remain specialist sensors, cortices, workers, governors and actuators. The Brain is a logical control architecture above them, not a replacement project beside them.

## 2. Design principles

1. **One shared truth.** No agent-owned shadow dataset may become the primary business truth.
2. **Evidence before inference.** Facts, hypotheses, AI interpretations, outcomes and patterns are distinct object types.
3. **Central prioritisation.** Specialist systems may propose actions; the Decision Fabric determines company-wide priority.
4. **Action is measurable.** A mission defines baseline, success metric, protected metrics and stop/rollback conditions before execution.
5. **Autonomy is default.** Safe and reversible work should execute automatically. Human attention is reserved for hard boundaries.
6. **Production is not a human gate by definition.** Exact tested candidates may be promoted automatically through the production constitution.
7. **Learning is contextual.** The system learns what works for which audience, entity, channel, problem, time and context, rather than creating global winners from isolated observations.
8. **Delta-first and cost-aware.** Cache, deduplicate, process changes only and use the cheapest computation capable of reaching sufficient confidence.
9. **Failures are intermediate states.** Safe recoverable failures enter the GREEN-UNTIL-DONE loop; identical retries are limited by the two-strike rule.
10. **No big-bang rewrite.** Existing systems are wrapped in common contracts, observed, shadowed and only then progressively governed by the Brain.

## 3. Architectural model

### 3.1 Intelligence backbone

The backbone consists of:

- Source Intelligence Layer
- Datahub and event backbone
- Knowledge Graph
- Evidence and identity resolution
- Specialist cortices
- Signal Engine
- Opportunity Graph
- Executive Decision Fabric
- Brain Work Queue / Mission Queue
- Agent team composition and orchestration
- Actuators and production controls
- Outcome, attribution and learning
- Current-state and consolidated memory projections

### 3.2 Source Intelligence Layer

The Brain should not rely on one giant crawler. Sources are managed through `discover -> qualify -> fetch -> refresh`.

Eligible sources include authorized internal systems and lawful, relevant external sources such as company sites, news, public datasets, research, search data, reviews, publications, changelogs, product launches, pricing pages, vacancies, social signals and existing connected business systems.

Each source carries at least:

- source identity and URL/reference
- capture time and freshness
- entity/topic/language
- reliability and independence
- rights/access classification
- content hash and provenance
- retrieval and processing cost

Only changed deltas continue downstream. Refresh frequency is adaptive: stable sources are polled less; changing sources more frequently. The standard cost ladder is `cache -> diff -> deterministic filter -> cheap extraction -> relevant delta to AI -> heavy model only when expected value justifies it`.

### 3.3 Knowledge Graph

The graph connects market, commercial, interaction, content, website/SEO, product, opportunity, experiment, operational, cost and learning domains.

Representative relations include:

`Person -> works_at -> Company`

`Person -> mentioned -> Problem`

`Problem -> supports -> Opportunity`

`Opportunity -> produced -> Mission`

`Mission -> created -> Content/Page/Feature/Contact`

`Action -> influenced -> Lead/Meeting/Order`

`Outcome -> supports_or_contradicts -> Pattern`

Existing sales and commercial systems are integrated rather than replaced. CRM, DM history, identity sync, warm-DM logic, lead ingestion, email responses, dayplan synchronization and commercial outcome synchronization become sources of relationship state and commercial outcomes.

## 4. Specialist cortices

Existing systems are grouped logically into the following cortices.

### Research & Evidence Cortex
Uses existing cost-bounded research, claim verification, verified research APIs and cross-channel strategy intelligence. It classifies fact, evidence, hypothesis, opinion, contradiction and staleness.

### Identity & Relationship Cortex
Combines DM identity, DM history, CRM, audience intelligence and Commercial Graph information to understand person, company, role, interaction history, problem, buying stage, relationship warmth and value.

### Market & Opportunity Cortex
Combines opportunity-market logic, audience cohorts, DataForSEO/search demand, research and cross-channel evidence to detect opportunities from market changes, search demand, competitors, technologies, regulations, customer conversations, sales loss, successful content, vacancies, website behavior and product usage.

### Commercial Cortex
Combines CRM, DM, response, audience, buying-stage and outcome information to determine possible next commercial actions, including no action/wait, reply, DM, email, call, case, landing page, meeting or other approved interventions.

### Content & Creative Cortex
Combines content calendar, narrative calibration, carousel production, reel/video production and scene learning. Creative elements are learned separately: hook, problem framing, proof, image/video concept, scene, CTA, length, format, audience and channel.

### SEO & Demand Cortex
Combines SEO optimization, search volume, GSC/GA4 learning, search opportunities, blog updating and SEO autopilot logic. SEO signals may produce content, product, commercial, landing-page, research or watch actions rather than only blog actions.

### Product, Website & UX Cortex
Combines Frontend UX, Frontend Wiring, portal/web evidence, verified research, browser/runtime evidence and QA. Market or commercial evidence can produce missions to build a landing page, calculator, scan, portal module, proof block, AI tool or product feature.

### Operational Nervous System
Combines telemetry, self-healing, QA/regression, runtime sentinel, continuity/recovery and performance systems.

### Economic Cortex
Combines Make Cost Optimizer, Cost Snapshot Collector, Cost + Runtime Guard, Adaptive Cost & Quality Governor and System Performance. Every mission has an economic price and value expectation.

### Security & Governance Cortex
Combines zero-trust security, knowledge governance, research verification, provenance and production gates. Security is a precondition of the decision, not an afterthought.

### Learning Cortex
Combines outcome-to-learning, intent learning, SEO learning, narrative calibration, learning optimization, shared learning ledger, shared team context, outcome routing and channel-specific learning.

## 5. Executive Decision Fabric

The Decision Fabric receives candidate incidents, opportunities and improvements from all cortices and determines what matters now.

### 5.1 Universal candidate model

Every candidate includes:

- type and target entities
- evidence references, freshness and confidence
- expected business value
- strategic fit and urgency
- execution cost and time
- risk
- learning value and reusability
- dependencies
- reversibility
- autonomy class
- protected metrics

### 5.2 Hard gates

Hard rules are evaluated before ranking. They include security, privacy, permissions, legal/financial boundaries, budget envelope, production health, contact-pressure limits, minimum evidence quality and data freshness.

A candidate may be rejected, deferred, reduced to research/watch, or marked `BLOCKED_HARD_BOUNDARY`.

### 5.3 Priority and portfolio policy

The conceptual priority score is:

`Priority = Business Impact x Probability x Urgency x Strategic Fit x Evidence x Learning Value x Reusability / (Cost x Risk x Time x Opportunity Cost)`

In implementation this should be normalized to avoid zero/division pathologies. Hard gates remain separate from scoring. A practical expected-utility formulation may combine value, learning and reuse benefits minus execution, risk and opportunity costs, with urgency, strategy, evidence and confidence modifiers.

The Brain manages several lanes rather than a single undifferentiated sorted list:

- production/security incidents
- customer/commercial work
- growth/opportunity work
- improvement/cost work
- exploration/learning work

Emergency lanes can preempt. Portfolio policy prevents one domain from starving the rest. `WAIT` and `DO_NOTHING` are valid first-class choices.

### 5.4 Decision outputs

Allowed canonical decisions include:

`IGNORE`, `WATCH`, `RESEARCH`, `CONTACT`, `CREATE_CONTENT`, `BUILD`, `TEST`, `FIX`, `OPTIMIZE`, `SCALE`, `PAUSE`, `ROLLBACK`, `ESCALATE_HARD_BOUNDARY`.

Every decision stores evidence, alternatives considered, rejected alternatives, policy/algorithm version, expected utility, confidence, risk/autonomy class and reevaluation time.

## 6. Team composition and missions

The Brain does not assign every problem to one monolithic AI agent. It chooses the smallest team of existing specialist agents/scenarios that has the required capabilities.

The existing 16 Powerhouse Agents remain workers. Architect/Integrator and the closed-loop orchestrator compose temporary teams. Shared context is provided from the central memory projection; workers must not recreate a competing primary truth.

Every executable decision creates a Mission object containing:

- objective and mission type
- target entities
- baseline and hypothesis
- success and protected metrics
- constraints and dependencies
- resource budget and deadline
- required capabilities and assigned agents
- context package
- rollback strategy
- current state, attempt count and next action

The execution loop is:

`evidence -> hypothesis -> baseline -> plan -> test/canary -> protected metrics -> execute -> measure -> promote/rollback -> learn`

Mission failures are intermediate when safely recoverable. States include `PARTIAL`, `RECOVERING`, `DEGRADED`, `ROLLING_BACK`, `WAITING_DEPENDENCY`, `VERIFIED`, `PRODUCTION_GREEN` and `BLOCKED_HARD_BOUNDARY`.

## 7. Opportunity-to-Production Autopilot

The opportunity lifecycle is:

`signal -> opportunity -> evidence -> business case -> experiment -> build -> validate -> production -> activation -> outcome -> learning`

Stages:

1. **Detect** — collect and combine signals.
2. **Validate** — verify evidence and market/customer fit.
3. **Test Demand** — use the cheapest reliable intervention, such as content, landing page, CTA, outreach, calculator or prototype.
4. **Build** — invest further only after evidence crosses the configured threshold.
5. **Production** — pass exact-candidate QA, security, cost/performance and deployment gates.
6. **Activate** — align sales, SEO, content, social, email and website where appropriate.
7. **Measure** — evaluate real business and technical outcomes.
8. **Learn & Scale** — scale winners, stop losers and update shared memory.

Each opportunity receives a mini economic ledger covering research, build, acquisition, operations and AI/Make/API cost versus expected and realized value.

A Portfolio Governor limits work in progress. The default design target is at most three large active opportunity experiments at once, excluding incidents and small optimizations. This number is configurable and may later be learned within protected limits.

## 8. Memory architecture

The Brain distinguishes seven memory types.

### Current State Memory
The latest verified operational and business state: production version, active scenarios, CRM state, current metrics, opportunities, costs and winning variants.

### Event Memory
Append-only history of what happened. Events are never silently rewritten.

### Entity & Relationship Memory
The Knowledge Graph connecting people, companies, problems, propositions, content, campaigns, agents, scenarios, products, opportunities and outcomes.

### Evidence Memory
Sources, claims, freshness, reliability, independence and contradictions supporting decisions.

### Experiment & Outcome Memory
Baseline, hypothesis, variant, audience, action, channel, cost, protected metrics and actual result.

### Procedural Memory
Proven recovery procedures, regression tests, fingerprints, fixes, prompts, workflows, safe API patterns and repeatable operating procedures.

### Strategic Memory
Slow-moving positioning, target markets, product rules, business goals, brand rules and hard constraints.

### Memory consolidation
Repeated observations can be consolidated into contextual Patterns with sample size, confidence, validity period and supporting/contradicting outcomes. Relevance decays when market evidence becomes stale; procedural knowledge remains durable until architecture changes.

The Context Compiler creates the smallest useful mission package from current state, relevant entities, evidence, known patterns, failures and constraints. Agents do not receive unrestricted raw history by default.

Agent observations are written through validation/routing before becoming shared truth:

`agent observation -> evidence/outcome -> validation/router -> consolidation -> shared memory`.

## 9. Learning Engine

Learning occurs across sources, signals, decisions, execution, creative, commercial outcomes and system performance.

### Contextual learning
A learning is always bound to context. The Brain must prefer statements such as “hook X performs well for audience Y on channel Z in context C” over global declarations such as “hook X wins.”

### Learned weights
Lead scores, opportunity scores, source quality, channel choice, timing, agent selection, cost prediction and decision weights may be calibrated from outcomes once sufficient evidence exists.

### Champion / Challenger
Important policies and models retain a proven Champion. Challengers pass historical replay, shadow evaluation and limited canary before promotion. Protected metrics must remain healthy.

### Shadow Brain
Alternative Decision Fabric versions may score real situations without executing them. Production decisions and shadow decisions can later be compared against outcomes.

### Controlled exploration
Safe, high-frequency choices such as hooks, CTA, scenes, images and timing may use bandit-style allocation. Higher-risk changes such as security, architecture, pricing or sensitive data handling must use stricter validation.

### Negative learning
Failures and negative outcomes generate explicit anti-patterns such as `DO_NOT_REPEAT_WITHOUT_NEW_EVIDENCE`.

### Cross-domain learning
A commercial objection may create SEO, content, video, website, product and market signals. Winning content may create product or sales opportunities. Cost/performance outcomes influence model and workflow choice.

### Agent and model learning
Per task type the Brain measures worker/model quality, duration, cost, retries, errors and business/production outcome. The Team Composer and Model Router use this evidence to choose the cheapest reliable combination.

### Brain self-improvement
Decision algorithms themselves may improve only through `proposal -> historical replay -> shadow -> challenger -> canary -> protected metrics -> champion`. The Safety Kernel is not self-modifying.

## 10. Runtime model

The Brain has four operating speeds.

### Fast Loop
Event-driven for urgent commercial signals, meaningful user interactions, severe anomalies, production failures, security events and high-value opportunities.

### Operational Loop
Bundles, deduplicates and incrementally processes routine events rather than starting an expensive reasoning cycle per event.

### Daily Brain
Produces a cross-domain daily business optimization view covering sales, market, opportunities, content, SEO, website/CRO, product, research, cost, performance, security, experiments and agent performance.

### Weekly Strategy Brain
Looks through daily noise to identify structural market, proposition, segment, content, product and operating changes.

### Opportunity interrupts
New opportunities are rescored against the active portfolio. Only candidates above interrupt policy preempt existing work; production/security incidents have hard interrupt priority.

### Central Brain Work Queue
Agents should increasingly become workers rather than independent cron-based prioritizers. Existing schedules remain during migration and are consolidated only when evidence shows it is safer and cheaper.

## 11. Autonomy and governance

The autonomy model has four classes.

### A0/A1 — observe and safe internal action
Read, analyze, deduplicate, research, classify, enrich, generate tests, improve caches, create internal variants and perform other safe/reversible operations autonomously.

### A2 — reversible business action
Approved-policy, reversible external/customer-facing or business experiments may execute automatically when contact-pressure, evidence and measurement requirements are met.

### A3 — production change
Software, website, portal and automation changes may be promoted automatically only through the production constitution.

### A4 — hard boundary
Human approval is required for credentials/secrets/permissions changes, weakening security, destructive/irreversible data mutations, new paid commitments/resources, or legal/financial commitments.

The Safety Kernel sits above AI and cannot be overridden by expected value or learned weights.

### Production constitution

`baseline -> hypothesis -> isolated candidate -> regression tests -> security -> cost/performance -> exact candidate verification -> preview/canary where relevant -> production -> exact production verification -> protected metrics -> GREEN`

If a critical protected metric fails:

`ROLLBACK -> last-known-good -> diagnose -> new hypothesis -> new candidate`.

The system follows GREEN-UNTIL-DONE and the two-strike retry rule. One specialist must not be its own full judge: builder, QA, security, cost/performance, production authority and outcome/learning retain separation of duties.

## 12. Universal data contracts

All Brain objects use a shared envelope with at least:

`id`, `schema_version`, `created_at`, `updated_at`, `producer`, `workspace`, `trace_id`, `correlation_id`, `parent_refs`, `classification`, `data_quality`, `confidence`, `expiry`, `provenance`.

### Signal
Represents a meaningful change. Includes source, entity refs, observed time, freshness, evidence refs, confidence, severity, domain, baseline change, dedupe key and processing cost.

### Evidence
Represents support for claims. Includes source, capture time, freshness, reliability, independence, entity/claim refs, contradictions, content hash, access class, cost and provenance.

### Opportunity
Represents a potentially valuable problem or chance. Includes target entities, audience, market, signals, evidence, confidence, expected value, urgency, strategic fit, competition, learning/reuse value, cost/time, risk, expiry and candidate actions.

### Decision
Represents the explicit Decision Fabric output. Includes candidate, action, policy/algorithm version, evidence, alternatives, rejection reasons, expected utility, confidence, risk/autonomy class, capabilities, budget, protected metrics and reevaluation time.

### Mission
Represents the execution contract described in section 6.

### Experiment
Includes hypothesis, control/variants, population, allocation, start/stop conditions, sample size, cost, primary metric, secondary/protected metrics, result, confidence and causal strength.

### Outcome
Includes mission/decision/experiment refs, action, timing, expected and actual result, business value, cost, latency, quality, errors, protected metric effects, attribution, confidence and learning refs.

### Pattern
Includes type, context, conditions, recommended action, expected effect, sample size, confidence, validity, decay, supporting/contradicting outcomes and status (`EXPERIMENTAL`, `EMERGING`, `PROVEN`, `DEGRADING`, `RETIRED`).

### Current State
Includes entity, state type, current value, validity start, source of truth, last verification, confidence, version and previous state ref.

The architecture uses immutable events plus rebuildable projections. Mutating actions require deterministic idempotency keys. A single trace ID should make the full chain reconstructable from evidence to revenue, production outcome and learning.

## 13. Measurement and attribution

The Brain separates:

- operational metrics: uptime, errors, latency, credits, retries, data quality
- behavioral metrics: clicks, scrolls, replies, sessions, feature usage
- business metrics: qualified leads, meetings, proposals, orders, revenue, margin, retention, time/cost avoided

Every experiment has one primary metric and protected metrics. Local gains may not be promoted when downstream quality or business metrics materially deteriorate.

Commercial journeys retain the raw touch sequence as well as attribution interpretations:

`source/signal -> content/interaction -> website -> lead -> CRM -> meeting -> proposal -> order -> revenue`.

SEO and content similarly link demand/topic/creative elements to downstream commercial outcomes.

Outcomes receive causal confidence. Controlled experiments/holdouts receive more learning weight than simple correlation. Counterfactual estimation may use control groups, historical baselines, comparable cohorts, seasonality adjustments or synthetic controls when data supports them.

Each opportunity maintains a value ledger: research, build, AI/API/Make, acquisition, sales/operational cost, incremental revenue/value, margin and learning value.

The Brain optimizes for incremental business value, not activity volume.

Before execution every measurable Mission defines baseline, primary metric, protected metrics, measurement window, attribution method and stop conditions. Otherwise it enters `MEASUREMENT_REQUIRED`.

Where direct euros are unavailable the Brain may use a calibrated Business Value Unit. Proxy values are recalibrated when downstream real outcomes become available.

## 14. Failure, observability and data quality

Every source, transformation, identity match, projection and actuator has explicit health and confidence.

Source states include `HEALTHY`, `STALE`, `DEGRADED`, `CONTRADICTED`, `UNAVAILABLE`. Last-known-good data may remain available with reduced freshness/confidence, but degraded data may not silently retain full autonomy.

Identity resolution requires confidence thresholds. Uncertain records remain `POSSIBLE_MATCH` instead of being merged automatically.

Contradictory evidence remains explicit. Low-confidence conclusions should produce `RESEARCH` or `WATCH` rather than high-risk execution.

AI outputs are classified as extraction, classification, inference, recommendation or generated content. AI interpretation is not evidence by itself; claims require source/data/outcome support before promotion to fact or Pattern.

End-to-end traces cover source, normalization, identity, scoring, decision, execution and attribution. Observability covers technical health, data quality, business health and learning health.

Schema drift is detected at contract boundaries. Safe adapters may self-heal; otherwise the route degrades without contaminating the rest of the Brain.

Runtime errors use `detect -> fingerprint -> root cause -> regression test -> smallest fix -> retest -> production verification -> learning`. Two identical retries per hypothesis are the maximum before changing hypothesis/fix/fallback.

Actuators require idempotency and compensating actions where possible. Suspect records enter quarantine rather than being silently deleted or used. Current-state projections are periodically checked against immutable events and can be rebuilt.

Escalation order is: self-heal -> degrade/fallback -> rollback -> alternative route -> human only for a true hard boundary or irreducible uncertainty.

Invariant: **unhealthy data may reduce autonomy, but may never silently preserve full confidence**.

## 15. Economic and performance architecture

Every mission tracks resource cost including Make credits, AI tokens, API calls, transfer, compute, storage, runtime, retries and maintenance burden.

Research follows value-of-information logic: continue only while the expected benefit of more information exceeds its cost.

The standard compute ladder is:

`cache -> deterministic rule -> incremental query -> statistical calculation -> small model -> larger model -> multi-agent reasoning`.

Processing stops as soon as sufficient confidence exists.

Semantic caching keys on topic/query, entities, evidence version, freshness, context and policy version. New evidence invalidates only affected cache entries.

All integrations are delta-first and prefer one ingest with multiple consumers. Deduplication happens before AI.

Every Mission receives a budget envelope covering compute, Make credits, external calls, AI cost, runtime, retry limit, preferred models and fallbacks. The Brain may reallocate existing resources toward higher expected value while remaining inside hard budget boundaries.

Cost is measured per useful outcome, not only per scenario. Metrics include cost per verified signal, opportunity, qualified lead, meeting, published asset, production improvement, useful learning and unit of incremental value.

Scenario efficiency considers runs, operations, credits, errors, useful outcomes, duplicate work, idle polling and downstream value. Candidate actions include `CACHE`, `BATCH`, `MERGE`, `EVENTIFY`, `REDUCE_FREQUENCY`, `REWRITE_DETERMINISTIC`, `RETIRE`; all remain subject to baseline, tests and protected metrics.

Cost anomalies create interrupts. User-facing systems also have performance budgets for usable UI time, API latency, memory, CPU, payload, background refresh and interaction latency.

The economic objective is **maximize incremental business value per resource unit subject to protected quality, security and strategy constraints**, not “minimize cost”.

## 16. Integration with existing Powerhouse

The existing system is treated as the implementation foundation.

### Control plane and shared memory

- BG156: closed-loop orchestration; evolves toward Mission orchestration
- BG166: append-only Error & Learning Ledger; foundation for event/learning persistence
- BG167: Shared Multi-Agent Team Context; evolves toward current-state/context projection and Context Compiler
- BG168: Outcome & Learning Router; evolves toward universal outcome/learning routing
- BG169: Production Promotion Controller; remains deterministic production authority
- existing zero-trust, cost, runtime, activity and recovery systems remain horizontal governors

### Existing domain systems

Existing SEO, research, audience, CRM, LinkedIn, Instagram, creative, cost, opportunity and learning scenarios remain specialist inputs and executors. Stable specialist responsibilities are not merged merely for architectural neatness.

Legacy, retired, canary and security-hold systems are excluded from active Brain functions until their remaining knowledge/dependencies are proven safely transferred.

The first implementation objective is therefore not scenario consolidation. It is a universal `Signal -> Opportunity -> Decision -> Mission -> Outcome` contract layer and a central cross-domain priority queue.

## 17. Migration architecture

The migration deliberately avoids a big-bang rewrite.

### Phase 0 — Baseline & inventory
Capture active components, triggers, inputs/outputs, dependencies, sources, costs, runtime, errors, consumers and criticality. Classify legacy/inactive/canary/security-hold separately.

### Phase 1 — Universal contract adapters
Wrap existing outputs into Brain Evidence, Signal, Outcome and Current State contracts without rewriting stable internal logic.

### Phase 2 — Event backbone & Knowledge Graph
Create traceable events, relationships and current-state projections. Begin with current state and high-value commercial/operational history; enrich older history incrementally.

### Phase 3 — Brain OBSERVE mode
Generate opportunities, priorities, proposed decisions, teams and expected outcomes without executing. Compare with actual behavior and outcomes.

### Phase 4 — Shadow Decision Fabric
Record a prior shadow choice for each relevant real situation, then calibrate decision/source weights against outcomes.

### Phase 5 — A1 autonomous missions
Enable safe internal/reversible operations such as research, dedupe, caching, data-quality repair, test generation and technical optimizations.

### Phase 6 — A2 business experiments
Enable reversible business tests such as SEO/content/CTA/landing-page/publication/outreach experiments within approved policy and measurement gates.

### Phase 7 — A3 production autonomy
Allow software, website, portal and automation changes through the exact-candidate production constitution and automatic rollback.

### Phase 8 — Opportunity-to-Production
Enable the full market opportunity -> validation -> experiment -> build -> production -> activation -> commercial outcome -> learning chain.

### Phase 9 — Consolidation
Use runtime evidence to identify duplicate ingest, idle polling, unnecessary AI, obsolete flows and consolidation opportunities. Retirement itself is a measured, reversible Mission.

### Phase 10 — Self-improving Brain
Allow Decision Fabric/model/policy challengers to improve through replay, shadow, canary and protected metrics. Safety Kernel remains immutable by learning processes.

## 18. Success criteria

The Brain is considered operational only when an end-to-end trace can prove:

`internal/external evidence -> Signal -> Opportunity -> Decision -> Mission -> agent team -> safe execution -> production/business action -> measured Outcome -> attribution -> Pattern/Learning -> changed future Decision`.

For that trace the system must be able to explain:

- why the action was selected
- which evidence supported it and how fresh/reliable it was
- which alternatives were rejected
- expected value, cost and risk
- which team executed it
- exact production/action verification where applicable
- real outcome and causal confidence
- what was learned
- how the next comparable decision changed

The operational objectives are:

- higher incremental business value over time
- lower cost per useful outcome
- lower technical and business error rates
- faster time from signal to valuable action
- fewer duplicate computations/polls
- improved forecast calibration
- improved agent/model selection
- production health preserved through automatic gates/rollback
- human escalation limited to true hard boundaries or strategic decisions that explicitly require it

## 19. Explicit non-goals

This design does not authorize:

- a new monolithic AI agent that replaces all specialist systems
- a second shadow Datahub as primary truth
- mass deletion or merging of existing Make scenarios before evidence supports it
- autonomous credential, secret or permission changes
- weakened security controls
- destructive irreversible data migration
- new paid commitments or legal/financial commitments without human approval
- optimization for views, posts, runs or AI usage as ends in themselves

## 20. Architectural invariants

1. Evidence, inference and truth are separate.
2. Current State is a projection, not the historical source of truth.
3. Events are immutable and projections rebuildable.
4. Every mutating action is idempotent or has an explicit compensating strategy where technically possible.
5. Every Mission has measurable success and protected metrics before execution.
6. Every important Decision is explainable and versioned.
7. Every autonomous production change verifies the exact tested candidate and has last-known-good recovery.
8. Two identical retries per hypothesis is the maximum.
9. Degraded data reduces confidence/autonomy.
10. The Safety Kernel cannot be learned away.
11. Existing stable specialist systems are reused until evidence supports consolidation.
12. Business value, not automation activity, is the optimization target.

## 21. Next step

After user review and approval of this written specification, the next and only architectural-process step is to create a detailed implementation plan with the writing-plans workflow. No implementation should begin before that review gate is passed.