---
name: powerhouse-self-improvement-layer
description: Use for every Powerhouse task involving autonomous learning, self-improvement, model routing, agent objectives, evaluations, architecture health, learning compilation, or automatic improvement of code/models/processes.
---

# Powerhouse Self-Improvement Layer

## Zero-blind-retry: duplicate Supabase Preview migration replay (29 October 2026)

Observed incident `supabase|preview|duplicate-migration-version-23505|20261029-v1`: the external Supabase Preview app returned SQLSTATE **23505**, unique constraint `schema_migrations_pkey` (versions `20261005142118` on original CRO PR #5146 and `20261011111605` on original Mira PR #5161), even though protected Git had **784 unique migration version filenames**. The original production migration ledger had **784** records, whereas the owned CRO preview ledger had **779**; the five missing production versions must never be applied twice or written directly to migration history. A successful GitHub Required test or auto-merge does **not** imply the provider preview passed.

**Mandatory pre-action invariant for every existing release/agent/SkillOps writer:**
1. READBACK original candidate SHA, original PR writer lease, latest **provider-owned** check-run ID, producer/consumer app ID, production+Git+owned-preview migration `version,name` sets, and preview branch state. Distinguish missing versions, already applied versions, distinct name conflicts and provider transport/authorization failures.
2. CLASSIFY `MIGRATION_PREVIEW_REPLAY_DUPLICATE_VERSION` using original `tools/ci/supabase-preview-diagnosis.mjs`, capture exact version and immutable occurrence, and RECORD root cause and blocked status in the existing ONE BRAIN registry plus protected human documentation. A second blind replay of the same unchanged immutable version/source is **forbidden**.
3. RECOVER using original Supabase/GitHub owners only. If preview is stale with matching history, a **single supported rebase of the SAME original existing preview branch**, not a new paid preview project or a destructive reset, can be attempted under the original writer ownership. After the call returns, treat `CREATING_PROJECT` as **IN_PROGRESS**, NOT green. If provider rebase fails or remains stuck, leave the existing PR blocked and escalate precise provider evidence; no forced auto retry.
4. VERIFY completion only on the same original branch and exact candidate SHA: compare `version,name` with production/Git, require independent **Supabase provider check SUCCESS**, protected Required/BRAIN/CodeQL, exact main merge, Edge/Netlify production SHA, and finally real provider/outcome browser readback. A passing preview rebase receipt by itself is not success.
5. LEARN from one immutable fingerprint with exact failure cause, owner, before/after version counts, safe correction, regression test, Skills and portal System Map update; measure fewer repeated provider checks and zero ambiguous/orphan writes. No new cron, parallel branch, fake check-run, modified migration ledger, weaker mandatory gate, or fabricated release status.

This is a **prevention and fail-fast protocol**, not a guarantee that an external provider always succeeds on its first attempt. New checks must never conceal provider red when source checks are green. Regression: `tests/brain-supabase-preview-diagnosis-v1.test.mjs`.

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
