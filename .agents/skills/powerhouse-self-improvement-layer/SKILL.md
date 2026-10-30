---
name: powerhouse-self-improvement-layer
description: Use for every Powerhouse task involving autonomous learning, self-improvement, model routing, agent objectives, evaluations, architecture health, learning compilation, or automatic improvement of code/models/processes.
---

# Powerhouse Self-Improvement Layer

## Predictive public-market source priority and honest proof — 30 October 2026

- **Fingerprint:** `predictive|public-market|unfiltered-top80-crowds-out-valid-source-types|20261030-v1`; parent #4198, protected PR #5169, deployed original Edge `powerhouse-predictive-engine` v569.
- **Proven cause:** a global `ORDER BY strength LIMIT 80` selected 80 relationship-evidence rows, crowding out 7 public-news and 11 search-demand rows. The existing public-market payload correctly rejected the relationship evidence and the natural run returned `AI_PUBLIC_MARKET_EVIDENCE_REQUIRED`. Never fix this by exposing private signals, making up market evidence, or relaxing the min-two-independent-sources gate.
- **Permanent preflight:** filter `entity_scope=market` and exact approved source types **before** source-specific ranking limits. Reserve separate 24 `external_news` and 16 `search_demand` slots; use original signal provenance and key allowlists. Regression: `tests/brain-predictive-public-market-priority-20261030.test.mjs`.
- **Observed runtime acceptance:** protected merge `596c4cbcb5fa0e0cbd953d0483e4f98eb3dff613`; original Supabase Edge v569 source exactly matches main; authorized provider response 200 (18 source signals, 1 new forecast, 0 rejects); independent `powerhouse_forecasts` row carries 5 actual signal references. This proves a bounded technical canary, **not** the next natural scheduled run, forecast correctness, realized revenue or any social publication.
- **Recovery/learning:** record error → cause → unique source-index fix → protected tests → exact source/deploy readback → genuine runtime → independent forecast evidence → original outcome and calibration → Brain maturity. The portal must distinguish `TECHNICAL_RUNTIME_PROVEN_NATURAL_PENDING` from `NATURAL_RUNTIME_PROVEN_OUTCOME_PENDING` and `OUTCOME_EVIDENCE_PROVEN`; missing readback is `UNVERIFIED`. Do not promote BRAIN `OBSERVED` just because a repair or one manually authorized canary exists. No extra scheduler, fallback publisher, paid preview or duplicate side effects.


## Supabase migration first-pass source-of-truth and prevention — 29 October 2026

INCIDENT_PROTOCOL: `supabase|revenue-learning|migration-history-lock-stale-after-production-20261029` and `supabase|preview|duplicate-migration-version-23505|20261029-v1`.

All ORIGINAL migration, CRO, Heartbeat, ONE BRAIN, CI and release agents must run a **read-only three-way preflight before the first preview/merge**: compare the complete set of `(version,name)` from `supabase/migrations/*.sql`, `supabase/migration-history.lock.json` `applied`, and REAL Supabase production `supabase_migrations.schema_migrations`. Require 1:1 matching exact version/name identities and unique executable versions; never infer parity from a partial list, a cron status, a file count alone, or a `MIGRATIONS_FAILED` preview.

If production applied additional migrations, the SAME original migration writer must add only independently read-back identities to the source lock within ONE protected PR, with Brain evaluation under the canonical `tests/brain-*.test.mjs` path and separate generic tests under `learning.tests`. No blind SQL migration replay, direct history-table DML, renamed applied version, fabricated statement hash, new migrations writer, second scheduled executor or branch-history deletion. Protected Required/CodeQL and original Revenue Learning must pass again at exact candidate/main.

Classify GitHub Supabase Preview `SQLSTATE 23505` on an already present version as `PREVIEW_PROVIDER_HISTORY_REPLAY_CONFLICT`. Read exact provider preview migration history and source file (not just red check summary), compare version+name, and do NOT blindly re-run or falsely mark success. Use only Supabase-supported branch reconciliation within the original branch's authorized cost/data boundaries; no new paid preview without explicit permission, and never bypass the independent provider check. Exact-head provider SUCCESS and preview `FUNCTIONS_DEPLOYED` plus 1:1 provider migration readback are independent release obligations; if not proved, retain BLOCKED.

Observed 2026-10-29 correction: protected source lock 774, original CRO PR 779 and production Git SQL manifest 784; the original 779-row preview initially missed five newest migrations and yielded SQLSTATE 23505 on older already-present versions. The original provider rerun now reports 784/784 and `FUNCTIONS_DEPLOYED` after source reconciliation. Counts are historical **not perpetual thresholds**; evaluate the current complete set every time. Every new failure must be fingerprinted with exact provider request/check ID, cause, safe action, regression and human/portal evidence. A test passing once proves the test route, not perpetual flawless provider execution.

## Production runtime truth and anti-false-green routing — 29 October 2026

INCIDENT_PROTOCOL: agents-skills-register-and-self-fix-v1
Fingerprint: `powerhouse|runtime|cron-success-without-business-proof|20261029-v1`.
Parent: [existing Powerhouse one-loop issue #4918](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4918).

Every existing Brain/Heartbeat/Agent Fabric agent must re-read the **current** `public.powerhouse_one_brain_runtime_health_v1`, `public.powerhouse_loop_integrity_health_v1`, `public.powerhouse_terminal_control_plane_health_v1`, the canonical daily `content_publication_obligations`, and most recent **distinct** `powerhouse_runtime_events` (event_type + source + subject_key, latest updated_at) before asserting a terminal state. The 2026-10-29 observed baseline of 32/32 WIRED and 18/18 active jobs **coexisted** with 2 runtime errors, a BLOCKED content loop, 2 learning evidence gaps, 2 escalated `RESULT_UNKNOWN` jobs and non-green loop assurance. Wiring is not execution.

A `cron.job_run_details.status=succeeded` for `net.http_post` means **only SQL submitted an HTTP request**, not that the Edge function completed, forecasts were calibrated, leads converted, or any public provider side effect happened. Demand the original Edge function's response, same-run application event, unique provider/source receipt, freshness, independent verifier and actual before/after outcome. If market evidence is missing, do not backfill 1,540 due calibrations with inferred zero or fabricate a successful forecast run. Leave `AI_PUBLIC_MARKET_EVIDENCE_REQUIRED` unresolved and delegate a bounded source-backed correction to the existing forecast owner.

The two legacy resilience operations with `RESULT_UNKNOWN` must retain their `ESCALATED` jobs until the original executor verifies the remote result; `side_effect_state=NOT_STARTED` in an internal stale heartbeat alone does not authorize blind replay. For `powerhouse_full_cycle_production_proof` preserve the original failing provider, predictive, content and outcome sub-gates and their exact date even when the surrounding cron succeeded. Project each original fingerprint to existing Brain failure registry, human change log, SkillOps and authenticated portal with its **actual** source state; no database status-only GREEN patch.

Before claim `ALL_GREEN`, require **zero current runtime errors, zero required learning-evidence gaps, a verified non-blocked content loop, no due/red/amber assurance gates, no unresolved escalated recovery, original provider readback, and outcome-grounded applied skill evidence**. Otherwise report the precise `AMBER/RED/UNPROVEN` partition and keep independent healthy jobs active. Reuse the already protected `assessPowerhouseHandoffs` guard only when its actual runtime emitter and independent verifier are connected; a source-level guard or synthetic test passing is not runtime-wide adoption.

Regression: `tests/brain-powerhouse-runtime-truth-routing-20261029.test.mjs`. Human reference: `docs/changes/2026-10-29-powerhouse-runtime-proof-routing.md`. No extra cron, writer, publisher, store, bypass, or historical reclassification.

## ONE BRAIN / Heartbeat / Agent Fabric handoff verification — 29 October 2026

For material cross-domain execution, consume the existing canonical capability inventory, original tenant-bound Brain/Heartbeat run receipts, and the independent provider/outcome verification. The pure guard is `brain/operating-loop/powerhouse-integration-handoff-evidence.mjs#assessPowerhouseHandoffs` (regression `tests/brain-powerhouse-integration-handoff-20261029.test.mjs`; failure fingerprint `powerhouse|existing-brain-heartbeat-handoff-evidence|20261029-v1`).

The required chain is **OBSERVE → DECIDE → EXECUTE → READBACK → OUTCOME → LEARN → PREVENT**. All stages require same tenant, correlation and source revision, a unique predecessor-linked receipt and a genuinely independent readback. AGENT execution additionally requires actual pinned skill loader/application evidence from the pre-existing validator; SQL stages must never impersonate agents. An outcome needs actual before/after measurements; paid revenue needs original provider payment proof. Missing data is UNPROVEN, never automatic zero, live, success or revenue.

This guard is initially a tested source candidate, **not yet connected to all running emitters**. Only the existing Heartbeat/Agent Fabric writer may wire real receipts into the guard and the authenticated portal, following protected merge, exact runtime readback and the same Brain learning/writeback policy. No new scheduler, agent, truth store or second writer.


Fingerprint: `powerhouse|self-improvement|evidence-eval-compare-promote-measure-learn|v1`.

## North Star

Powerhouse must function measurably better tomorrow than today without degrading reliability, safety or code quality.

## Mandatory loop

`Observe → Detect → Hypothesize → Build → Test → Evaluate → Compare → Promote → Measure → Learn`

Every material loop must reconnect to:

`Company Graph → System of Context → Intelligence → Agents → Actions → Outcomes → Outcome Memory → Learning → next decision`.

## Required controls

- Every agent has an explicit measurable objective and hard guardrails.
- Every prompt/model/tool/routing/policy/code change is a versioned candidate.
- Unknown evidence is not green.
- Promotion requires quality + security + regression proof and measurable improvement.
- Model routing is provider-neutral and privacy/capability constrained.
- Architecture Guardian blocks dependency cycles, critical security findings and schema drift.
- Learning Compiler projects verified learning into tests, skills, docs, System Map and bounded optimization candidates.
- Autonomous learning may generate and evaluate changes but may never bypass protected delivery or directly self-rewrite production.

## Canonical authorities

- `brain/self-improvement/self-improvement-layer.mjs`
- `brain/contracts/self-improvement-layer-v1.json`
- `public.powerhouse_agent_objective_registry_v1`
- `public.powerhouse_learning_compiler_queue_v1`
- `public.powerhouse_self_improvement_control_v1`
- `public.powerhouse_run_self_improvement_layer_v1(date)`
- Existing `public.powerhouse_optimization_candidate_v1`, `public.powerhouse_quality_events`, `public.powerhouse_model_health_v1`, `public.powerhouse_autonomous_improvement_control_v1`, Company Intelligence OS and protected delivery remain authoritative.

## Closure

Material changes must update regression protection, learning, relevant skills, documentation and the canonical System Map in the same delivery lineage.

## Terminal production proof rule

A Self-Improvement change is terminal only after protected-main merge, Supabase/runtime readback, canonical scheduler readback, regression proof, advisor readback, learning writeback and System Map writeback. The current v1 baseline is LIVE_PROVEN_RUNTIME with 6 agent objectives, 8 compiler-ready items, zero evidence/regression gaps, one canonical daily cron and a verified non-duplicating runtime event.

## Prediction-intelligence bridge

Prediction quality is a first-class Self-Improvement objective. Consume `public.powerhouse_prediction_intelligence_control_v2` and `public.powerhouse_prediction_improvement_queue_v2`. Prefer fewer well-resolved, calibrated forecasts over higher forecast volume. A degraded Brier score, calibration error, timing MAE, resolution coverage or signal diversity must create a bounded challenger/backtest obligation rather than an uncontrolled production rewrite.

## Daily compound-learning prerequisite

Before the daily Self-Improvement observation, Powerhouse must run the canonical compound-learning pass:
- capture only verified observed runtime outcomes into the existing Outcome Memory;
- link outcomes back to executed actions when lineage exists;
- resolve eligible forecasts only from explicit verified outcomes;
- never infer a negative result from silence;
- expose outcome coverage and forecast-resolution coverage through `public.powerhouse_daily_compound_learning_control_v1`.

Canonical runner: `public.powerhouse_run_daily_compound_learning_v1(date)`. It is scheduled once daily before the Self-Improvement cron. Whole-Brain integrity and Universal Closed-loop Learning must also run daily, so “everything works with everything” is continuously regression-tested rather than assumed.


## Daily Compound Learning inheritance

Fingerprint: `powerhouse|daily-compound-learning|all-nodes-inherit|v1`.

This skill inherits the canonical daily compound-learning contract. Every material chat/agent execution must:
- consume bounded shared context and existing learning before acting;
- preserve one canonical outcome/forecast/learning lineage;
- treat only verified observed evidence as outcome truth;
- never convert silence, transport success, synthetic/test events or forecasts into realized outcomes;
- feed verified outcomes into Company Intelligence, Forecast Calibration and Self-Improvement;
- write material learning/prevention back so the next chat or agent changes its next decision;
- remain discoverable through System Map and canonical skill projection.

Canonical runtime: `public.powerhouse_run_daily_compound_learning_v1(date)`.

## Cross-domain change evolution (2026-10-08)
Canonical pure planner: `brain/self-improvement/cross-domain-evolution.mjs#planCrossDomainEvolution`.
- For every material AI model, connector, portal, engineering or strategy policy revision, bind tenant, change ID, exact source revision and both policy versions.
- Reuse the Organism Graph to calculate affected domains. Explicitly review GDPR, EU AI Act, NIS2/Cbw, security, and CSRD/ESRS applicability when dependency paths require it; an unknown compliance scope never implies applicability or non-applicability.
- Match only fresh, independently verified outcomes to the same tenant/revision, with provider receipt or production readback; delivery ACK, synthetic/test event, forecast, absent response and vanity metric are not realized value.
- Demand verified independent evidence from business and engineering plus a genuine controlled comparison before recommending a challenger for protected delivery.
- Fail closed on missing review, counterfactual, evidence, security/regression or cost/latency guard. Produce a deterministic canonical obligation proposal, never a second executor, scheduler, database, model-policy setter or direct production mutation.
- The responsible Brain runtime must durably materialize and execute the proposal through existing obligations/outbox, reconcile provider outcomes and project learning; a planner's PROPOSED_NOT_EXECUTED output is not live delivery evidence.
Regression: `tests/brain-self-evolving-business-engineering-os-v1.test.mjs`.

## Self-Evolving OS learning-to-candidate bridge (2026-10-08)

Fingerprint: `self-evolving-learning-candidate-bridge-20261008-v1`.

- Consume READY *verified* quality-event learning from `public.powerhouse_learning_compiler_queue_v1` only through the existing `powerhouse-self-improvement-layer-v1` daily owner.
- Materialize a bounded maximum of three uniquely keyed, review-required, non-executable candidates into `public.powerhouse_optimization_candidate_v1` per run. Never create another learning store or cron.
- Do not treat evidence that a previous defect was fixed as evidence that the proposed next improvement will work. Candidate confidence is uncalibrated, impact is unknown, outcome remains unmeasured.
- BG169 remains the only production action authority. Approval, representative testing, protected merge, production readback and verified benefit must precede any promotion claim.
- The migration and regression are `supabase/migrations/20261008162000_self_evolving_learning_candidate_bridge_v1.sql` and `tests/brain-self-evolving-learning-candidate-bridge-v1.test.mjs`. The new behavior is NOT live until protected merge and database/runtime readback confirm it.

## Verified financial value closure (2026-10-08)
- Use canonical `powerhouse_realized_values`, `powerhouse_action_economics`, finance/provider source records and outcome lineage; never create a parallel economic-truth ledger.
- A legacy `truth_class=realized` with unit `not_executed`, `sent`, `execution_completed` or `reply_received` is **not** realized revenue or financial savings.
- Financial value requires a same-tenant, same-revision, independently read-back finance record, explicit EUR amount, financial proof type and linkage to a verified engineering outcome.
- The same source record counts once. The verified comparison must explicitly link the same business and engineering outcomes and have an independently read-back cohort assignment.
- `BUSINESS_VALUE_EVIDENCE_REQUIRED` is a valid fail-closed state, not green. Raw append-only evidence must remain unchanged. A proposal stays `PROPOSED_NOT_EXECUTED`.
- Regression: `tests/brain-self-evolving-business-engineering-os-v1.test.mjs`.

## Verplichte relevantie, incidentborging en dagelijkse feedback (2026-10-22)

Fingerprint: `powerhouse|agent-incident-relevance-daily-evolution|20261022-v1`.

- Elke huidige en toekomstige agent en chat leest vóór materieel werk de canonieke failure fingerprints, actieve obligations, vorige aanpakken, skillprojecties en bronbewijs. Reproduceer alleen als dit veilig nodig is; dedupliceer binnen dezelfde Brain-lineage.
- Ieder materieel incident, probleem, fout, herstel of verbetering behoudt oorzaak (of expliciet UNKNOWN), eigenaar, impact, mislukte poging, bewijs, bronstatus, herstel, preventieregel, regressietest en productieverificatie. Geen eenzijdige documentatie als bewijs van runtime-writeback.
- Veilige herstelacties zijn bounded, idempotent, herstartbaar, hebben retry-budget en worden getest vóór protected promotion. Menselijke OAuth, geheimen, destructieve mutaties, betaalde capaciteit, security-verzwakking en juridische/financiële toezeggingen blijven harde grenzen.
- De bestaande `Powerhouse Daily Self Evolution` en `Universal Closed-loop Learning` zijn de enige dagelijkse governance-eigenaren; voeg geen tweede cron, agentgeheugen, foutregister of agent-publisher toe.
- Dagelijkse verbetering vergelijkt minimaal herhaalde incidenten, hersteltijd, regressiedekking, bron-/bewijsdekking, doorlooptijd en klantwaarde met een geldige baseline; alleen aantoonbare vooruitgang mag via beveiligde CI/CodeQL/merge en exacte productie/providerreadback promoveren.
- Portaalroute `learning-writeback` heet `Relevantie & verbeteringen` en leest uitsluitend `portal.runtime.learning.items` uit de bestaande tenant-gebonden `brain-operating-loop` projectie. Alleen `PROVEN` uit Brain mag als bewezen verschijnen; ontbrekend bewijs blijft expliciet niet bewezen.
- Contract: `config/universal-closed-loop-learning.json`; gate: `scripts/brain/validate-universal-closed-loop-learning.mjs`; regressies: `tests/brain-universal-closed-loop-learning.test.mjs` en `portal-v2/tests/relevance-learning-closed-loop.test.mjs`. Werk na bewezen productie-uitkomst de bestaande System Map, leerlijn en skills bij.

## Relevantie: outcome-bewijs is verplicht (22 oktober 2026)

Fingerprint: `portal|learning-memory|proven-without-verified-outcome-evidence|20261022-v1`. Voordat de bestaande Portal V2 een leerrecord als "Bewezen in Brain" toont, moet de canonieke tenant-eigen living-memory projectie de originele source PROVEN, geverifieerde recordstatus, een daadwerkelijk uitgevoerde en geverifieerde outcome in dezelfde tenant en onveranderlijke evidence IDs bewijzen. De vereiste IDs moeten daadwerkelijk bestaan en bij de outcome aansluiten. Onvoldoende bewijs projecteert uitsluitend REVIEW_REQUIRED, zonder de opgeslagen records te wijzigen. Gebruik nooit losse healthy/status-ok flags als eindbewijs. Test met `tests/brain-portal-learning-memory-evidence-proof-v1.test.mjs`, hergebruik exact dezelfde Brain/ledger/System Map en houd alle bestaande CI, tenancy en productiepoorten verplicht.

## Fail-closed bewijslabel voor Portal Relevantie (2026-10-22)

Success/healthy van een transport- of runtimeprojectie is **geen bewezen bronherstel**. De canonieke tenant-geautoriseerde Brain-projectie moet expliciet een `PROVEN`-maturity, een echte productie/provider-readback en een onveranderlijke toegestane bewijsreferentie dragen voordat `Relevantie & verbeteringen` een item als `Bewezen in Brain` telt. Ontbreekt een van die drie, toon `Nog te verifiëren in Brain`; registreer hetzelfde fingerprint en herstel in dezelfde lineage. Een UI-label, testfixture, eigenaarcomment of merge is nooit op zichzelf productiebewijs. Regressie: `portal-v2/tests/relevance-learning-closed-loop.test.mjs`. Geen tweede registry of cron.

## Task-specific canonical learning reuse (25 October 2026)

Fingerprint: powerhouse|learning-preflight|intent-only-target-inference|20261025-v1.

The existing Brain preflight forwards natural-language intent to the canonical skill projection. Even without explicit delivery-lane labels, it reads the latest relevant historical prevention rules. Every mandatory and exact-fingerprint rule remains; other lessons are bounded. The receipt contains source-backed fingerprints, digest, inferred targets, match and truncation counts. A search miss never proves that no relevant prior fix exists.

New AI models, tools, skills and innovations are versioned candidates until freshness, provenance, tenant/privacy, cost, benchmark, Required+CodeQL and independent production proof pass. Do not create a second memory, scheduler, authority or unverified green status.

## Canonical skill source attestation (2026-10-25)

Fingerprint: `powerhouse|agent-skill-source-attestation|preflight-digest-load-boundary|20261025-v1`.

Before material execution, use the existing `scripts/brain/chat-learning-preflight.mjs` to obtain the latest deterministic inventory of `.agents/skills/*/SKILL.md`. Its `skill_projection.source_attestation` carries the source SHA-256, inventory digest, source path and task-matched selection. The four mandatory baseline skills are continuity, self-improvement, System Map governance and toolchain authority. Load the actual selected skill text and record actor, execution ID, source path, exact source digest and load timestamp in the existing canonical activity/learning evidence before claiming that a skill was consumed. `SOURCE_DISCOVERED_LOAD_READBACK_REQUIRED` is not a successful consumption claim; old skills without frontmatter remain visible as metadata warnings, not automatically upgraded.

External Agent Skills, MCP and OpenTelemetry conventions may be assessed as evidence-backed versioned candidates, **never auto-installed or promoted** on search results alone. Check official specification provenance, version, security/privacy, tool authority, cost and isolated regression before a protected release. Reuse current Brain, skills, Heartbeat, delivery and learning authorities; no parallel knowledge store or extra scheduler.

## 30 October 2026 — learning suggestion versus applied-proof invariant

Original Agent Fabric `suggestLearning` previously marked lessons reused on mere lookup. Fingerprint `powerhouse|agent-fabric|learning-suggestion-counted-as-applied|20261030-v1`; source `platform/agents/agent-fabric.mjs`. In the corrected original Fabric, lesson retrieval emits `LEARNING_SUGGESTED` only, with **zero** application count. An actual application must arrive via the existing admitted `APPLY_LEARNING` gateway command with the same natural run ID, exact tenant/fingerprint/action, source revision and execution reference; only the configured independent production verifier may authorize `LEARNING_APPLICATION_VERIFIED`. Do not interpret a caller-provided boolean, model narrative, test success or scheduled run as adoption. If no independent verifier or durable exclusive BRAIN writeback is installed, classify `APPLICATION_EVIDENCE_DUE`; never self-promote the skill or suppress the existing incident.

LinkedIn personal recovery is a representative replay: original OAuth setup v489 requests `openid,profile,email,w_member_social` only; owner consent remains human, and the already-created 29 October post cannot be duplicated. Independent LinkedIn GET 403 is not live proof. Require future original agent receipt with exact applied decision and real external verification where permission permits; otherwise keep each of the three gates separately open. Contract test: `tests/brain-agent-learning-application-proof-20261030.test.mjs`. Existing SkillOps / Heartbeat / Portal V2 are the only projections. No new scheduler or truth store.

## 30 October 2026 — contact approval is not automated research labour

Source incident `economics|internal-autoresearch|contact-approved-but-autonomous-proof-excluded|20261030-v1` (#4215). The original command-center materializer writes `human_approved` from `contact_extra` (a contact/send consent decision), while original `powerhouse_execute_relationship_research_v1` runs internal research without human labour or outbound provider side effects. A new economics row must NOT assume no human minutes purely because `human_approved=true`. Exception in the ORIGINAL bounded economics backfill only for an EXACT matched original `relationship_public_research_evidence` event with same action ID and timestamp, original research contract, `vendor_used=false`, `evidence_only=true`, `external_side_effects=false`. The non-approved original backfill branch is unchanged. Only that independently proven automated research may record 0 *human research execution* minutes; provider and external monetary costs stay `UNOBSERVED`/NULL. Do not alter contact permission, claim 0 outreach cost, infer customer orders or invent an economic observation.

At source inspection on 30 October 2026, 17 missing automated research economics records had genuine matching independent receipts; 5 SalesRobot DM and 2 reply follow-up records did not qualify. These remain separately open for original provider-cost/actual-outcome measurement. After protected merge, the existing Supabase migration owner must apply the SQL, and only the next original scheduler-mux pass plus `powerhouse_action_economics` independent readback can close the 17. Until then source is `CANDIDATE` and result `EVIDENCE_DUE`, never green. Regression `tests/brain-p0-4215-auto-research-contact-approval-economics-proof.test.mjs`; human change `docs/changes/2026-10-30-auto-research-contact-approval-economics-proof.md`. Exclusive writer, no second scheduler.
