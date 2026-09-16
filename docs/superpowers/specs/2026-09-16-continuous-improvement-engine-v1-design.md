# Powerhouse Continuous Improvement Engine v1 — Design

Date: 2026-09-16
Status: proposed-for-implementation
Fingerprint: `powerhouse-continuous-improvement-engine-v1`
Parent architecture: `powerhouse-engineering-os-v1`
Learning authority: `BRAIN-CHAT-LEARNING-v1`
Delivery authority: `BRAIN-DELIVERY-v2`
Technology-currency authority: `powerhouse-state-of-the-art-adoption-v1`
Runtime truth: existing Supabase/Brain records, runtime events, obligations, experiments and evidence lineage

## 1. Purpose

Turn the already-live shared-learning and architecture-evolution contract into a continuously operating improvement capability. The engine must detect recurring problems and opportunities from existing Powerhouse evidence, form deduplicated improvement candidates, compare candidates against current baselines, execute bounded evaluations, promote only evidence-backed improvements, observe post-promotion outcomes, roll back when regression thresholds are crossed, and write the resulting learning back to the same canonical Powerhouse authorities.

This design does **not** create a new brain, CRM, queue, learning store, architecture registry, analytics truth, experiment database or memory layer. It orchestrates and projects existing Powerhouse state.

## 2. Existing-state constraints

The implementation extends, rather than replaces:

- `powerhouse-engineering-os-v1` for executable engineering rules;
- `powerhouse-shared-learning-architecture-evolution-v1` for shared learning, skill evolution and architecture promotion gates;
- `powerhouse-autonomy-controls-v1` for budgets, AI regression, security, freshness, SLO/error budgets, DR proof and the multidimensional autonomy scorecard;
- `powerhouse-state-of-the-art-adoption-v1` for current external technology evidence;
- `BRAIN-CHAT-LEARNING-v1` for learning authority;
- `BRAIN-DELIVERY-v2` for candidate/release authority;
- existing Supabase `brain_records`, runtime events, obligations, experiments and evidence tables/views where applicable;
- existing Notion System Map, Human Handbook, Master Register, Latest Verified State and Agent Activity Log as human-readable projections.

No second durable state is permitted when an existing canonical structure can represent the record.

## 3. Capability lifecycle

The Continuous Improvement Engine uses one deterministic lifecycle:

`OBSERVE -> CLUSTER -> CANDIDATE -> BASELINE -> EVALUATE -> DECIDE -> SHADOW_OR_CANARY -> PROMOTE_OR_REJECT -> PROD_OBSERVE -> ROLLBACK_OR_CONFIRM -> ATTRIBUTE -> WRITEBACK -> REVALIDATE`

The lifecycle is a specialization of the Engineering OS golden path and never bypasses it.

## 4. Signal ingestion and candidate generation

The engine reads bounded evidence from existing authorities only. Material signals include:

- repeated incidents, blocker/failure fingerprints and recurring recovery paths;
- escaped regressions and failed Required/BRAIN/production checks;
- SLO/error-budget pressure;
- latency, performance, capacity or cost deltas;
- duplicate implementations, duplicate fixes and repeated agent confusion about ownership/authority;
- stale/deprecated/EOL/CVE dependency or provider signals;
- experiment outcomes and repeatedly successful local workarounds;
- new proven external techniques surfaced by the state-of-the-art evidence loop;
- business/outcome evidence showing persistent friction, low conversion, low reuse, high rework or poor lead time.

Candidate generation is deterministic-first. An LLM/agent may summarize or classify evidence but may not invent missing evidence, waive a gate, create a durable authority or independently promote a candidate.

### 4.1 Candidate identity

Each candidate receives a stable fingerprint derived from normalized:

- affected canonical component/authority;
- problem or opportunity class;
- causal/evidence cluster;
- proposed change class;
- relevant tenant/scope where applicable.

Equivalent candidates must coalesce before persistent write. Competing candidates for the same affected authority and problem cluster are marked as a conflict set and must be compared or superseded before implementation. Parallel hidden work is not allowed.

## 5. Fitness baselines

Every material candidate must compare against a current baseline. Baselines are projections of existing production evidence and may include:

- correctness/reliability/error rate;
- incident recurrence and regression escape rate;
- security/tenant-isolation posture;
- latency and throughput;
- capacity and cost;
- maintainability proxies such as duplicate solution rate, failed handoffs or repeated ownership confusion;
- test/eval quality and mutation/contract sensitivity where available;
- deployment/recovery metrics;
- data integrity/freshness/lineage;
- lead time and rework;
- relevant user/business outcome.

Unknown values remain `unknown`; they are never converted to zero. A candidate cannot claim improvement on a dimension without comparable evidence.

## 6. Evaluation and promotion policy

Candidate evaluation must use the same representative workload and evidence definition for baseline and candidate wherever technically possible.

Minimum promotion policy:

1. **Security and tenant isolation are non-degradation gates.** Any material weakening rejects the candidate unless it is explicitly required by a separately approved authority change and is protected by stronger compensating controls.
2. **Correctness/reliability are non-degradation gates.** Known regressions block promotion.
3. **Rollback/fallback must be executable before promotion.**
4. **Cost/latency increases require explicit compensated benefit.** A candidate may trade one dimension for another only when the trade-off is recorded, bounded and supported by measurable outcome improvement.
5. **No single aggregate score decides promotion.** Each material dimension retains its own evidence and threshold.
6. **Unknown critical evidence fails closed.** Non-critical unknowns may permit a bounded experiment but not an unqualified production promotion.
7. **Business outcome is required when the change is justified by business impact.** Technical proxies alone cannot prove that claim.

Thresholds live in the existing Engineering OS/config authority and are component- or candidate-class specific where universal numeric thresholds would be misleading.

## 7. Shadow, canary and bounded experiment

Where a production-equivalent evaluation is needed, use the smallest safe mechanism already supported by the affected component:

- shadow evaluation with no side effects;
- feature flag;
- canary or bounded traffic/sample;
- replay against recorded production-shaped fixtures;
- isolated branch/environment for destructive or schema-sensitive work.

Canary exposure must be bounded by the existing autonomy budget and SLO/error-budget policy. The engine must record candidate identity, control identity, exposure, observation window and rollback trigger.

External guidance used for this design: GitHub recommends reusable workflows for deterministic shared logic and protected status checks for merge gating; Google SRE describes canarying as a partial, time-limited deployment evaluated against a control to reduce rollout risk; OpenAI evaluation guidance emphasizes evaluating the complete agentic system rather than isolated outputs.

Primary references:
- https://docs.github.com/en/actions/reference/workflows-and-actions/reusing-workflow-configurations
- https://docs.github.com/en/pull-requests/reference/status-checks
- https://sre.google/workbook/canarying-releases/
- https://openai.com/index/trustworthy-third-party-evaluations-foundations/

## 8. Automatic rollback and confirmation

A promoted candidate enters a post-promotion observation window. Rollback triggers are evaluated against explicit per-candidate or per-component thresholds. Automatic rollback is allowed only when:

- rollback is reversible and already authorized;
- no destructive/irreversible boundary is crossed;
- exact candidate and last-known-good identities are known;
- trigger evidence is direct and current;
- rollback itself remains inside autonomy budget and security controls.

Otherwise the engine fails closed, opens one deduplicated obligation and preserves production evidence.

Successful observation confirms the candidate as current. Failed observation records the regression, rollback evidence and prevention learning.

## 9. Architecture debt and revalidation

Existing canonical records receive improvement metadata rather than a parallel debt database. Architecture/skill decisions that can age must carry:

- `observed_at`;
- provenance/source revision;
- freshness class;
- confidence;
- `revalidate_after`;
- owner or deterministic revalidation route;
- supersession/rollback lineage.

Debt signals include recurring workarounds, duplication, stale dependencies, unclear boundaries, repeated regression patterns and unowned temporary exceptions. Revalidation produces either `CONFIRMED`, `CANDIDATE_REQUIRED`, `SUPERSEDED` or `BLOCKED_HARD_BOUNDARY`.

## 10. Outcome attribution

The engine must distinguish immediate technical proof from longer-term effect. For material promoted changes it records an attribution window and compares post-promotion evidence with the pre-change baseline.

Attribution may report:

- incident recurrence delta;
- MTTR/diagnosis delta;
- duplicate-solution/reuse delta;
- regression escape delta;
- latency/cost/capacity delta;
- lead-time/rework delta;
- relevant business outcome delta.

Attribution is evidence, not proof of causality by default. When confounders exist, the record must state that limitation. No invented causal claim is permitted.

## 11. Skill effectiveness

Skill candidates use the same engine. Each versioned skill evaluation records representative cases, known failures, model/tool/harness identity where relevant, pass/regression evidence, latency/cost where material, and production outcome. A skill that repeatedly underperforms or becomes stale becomes a revalidation candidate; it is not silently mutated in place.

## 12. Conflict arbitration

Before execution, the engine checks existing open candidates, obligations and recent verified learning for overlap. For the same problem/authority it must choose one of:

- `COALESCE` — same effective solution/evidence cluster;
- `COMPARE` — competing approaches need evaluation;
- `SUPERSEDE` — stronger verified candidate replaces stale work;
- `ISOLATE` — genuinely independent scopes.

A conflict decision is written to existing evidence lineage. The engine never runs two overlapping production promotions merely because different agents proposed them.

## 13. External innovation bridge

`powerhouse-state-of-the-art-adoption-v1` remains the only technology-currency authority. Relevant external evidence can create a bounded improvement candidate only after applicability is established against current Powerhouse state. The bridge is:

`EXTERNAL_EVIDENCE -> APPLICABILITY -> CANDIDATE -> BASELINE -> EVAL -> DECIDE -> EXISTING_PROTECTED_DELIVERY`

No crawler/news feed becomes architecture authority. New techniques remain `WATCH` or `CONTROLLED_FRONTIER_EXPERIMENT` until evidence justifies promotion.

## 14. Architecture simulation

Before high-impact architecture changes, the engine performs a dependency-impact simulation using the existing System Map/config/source graph and available runtime evidence. The simulation must enumerate at least affected authorities, readers/writers, data/interface changes, permission/security boundaries, migration compatibility, rollback scope, likely tests/gates and production readbacks. Simulation is advisory evidence and does not replace real tests.

## 15. Failure injection and game days

Where the affected component supports safe fault injection, representative resilience evaluation should include provider timeout/error, stale data, auth/permission failure, dependency unavailability, quota/rate-limit pressure and rollback/recovery. These tests must remain bounded and never intentionally degrade uncontrolled production traffic.

## 16. Human-readable observability

The existing Powerhouse observability surfaces should expose, where available:

- candidate throughput by state;
- candidate age and open conflict sets;
- promotion/rejection/rollback counts;
- repeated-incident rate;
- prevented recurrence rate;
- known-fix/component reuse;
- duplicate-solution rate;
- time from signal to verified improvement;
- eval-gated change rate;
- revalidation overdue count;
- post-promotion attribution results;
- business/value outcome where applicable.

This is a multidimensional view, never one magic autonomy/architecture score.

## 17. Implementation shape

The initial implementation must stay small and composable:

- extend `config/powerhouse-engineering-os.json` with a `continuous_improvement` contract;
- extend `scripts/brain/powerhouse-engineering-os.mjs` fail-closed validation for the contract;
- add a focused executable under `scripts/brain/continuous-improvement/` that normalizes signals, fingerprints/coalesces candidates, evaluates required evidence, resolves conflict disposition and emits deterministic candidate decisions;
- reuse existing Supabase tables/records for runtime persistence; schema changes are allowed only if current production schema proves no existing canonical shape can safely represent required state;
- extend existing Required regression coverage rather than creating a parallel release gate;
- use reusable GitHub workflow logic only if an existing workflow cannot call the executable directly without duplication;
- project final release state and learning into existing Supabase/Notion authorities.

No autonomous production mutation is part of v1 beyond already-authorized safe rollback/promotion paths. v1 first makes detection, candidate identity, evidence requirements, conflict handling, decisioning, revalidation and attribution deterministic and enforceable.

## 18. Test strategy

Required tests must cover at least:

- no parallel store/authority;
- deterministic candidate fingerprinting and coalescing;
- conflict dispositions;
- unknown critical evidence fails closed;
- security/correctness non-degradation gates;
- compensated cost/latency trade-off requires explicit benefit evidence;
- baseline/candidate comparability;
- rollback identity and trigger requirements;
- revalidation semantics;
- attribution never overclaims causality;
- skill/version evidence requirements;
- external evidence cannot directly promote architecture;
- bounded experiment/canary metadata requirements;
- current Engineering OS/shared-learning/autonomy authorities remain unchanged;
- Required CI executes the regression tests.

Behavioral tests assert outcomes and contracts, not prompt wording.

## 19. Production/readback requirements

`LIVE & BEWEZEN` requires:

1. spec and implementation plan committed on an isolated feature branch;
2. RED test evidence before implementation for new behavior;
3. code/config/tests green locally/CI on the exact candidate;
4. Required and BRAIN delivery green on exact candidate;
5. protected merge to current `main`;
6. exact-main source readback proving the contract and executable are present;
7. direct Supabase readback of CurrentState + Learning using the merge SHA as source revision;
8. Notion System Map, Human Handbook, Master Register, Latest Verified State and Agent Activity Log updated and re-read;
9. no duplicate open authority/candidate line left behind;
10. terminal status with explicit open obligations.

## 20. Non-goals

- no autonomous redesign of the entire Powerhouse;
- no second architecture or learning database;
- no unrestricted self-modifying code;
- no blind newest-technology adoption;
- no single magic improvement score;
- no causal claims from correlation alone;
- no production chaos testing without bounded controls;
- no bypass of Required, BRAIN, security, budget or human/system hard boundaries.

## 21. Definition of done

The capability is done only when the engine can take representative existing Powerhouse evidence, deterministically produce or coalesce an improvement candidate, prove the baseline/evidence gates, resolve overlap, produce an allow/reject/experiment/revalidate decision, preserve rollback and attribution metadata, and complete protected release + Supabase/Notion readback without introducing a second durable truth.