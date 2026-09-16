# Powerhouse State-of-the-Art Adoption Contract

Fingerprint: `powerhouse-state-of-the-art-adoption-v1`
Status: ACTIVE
Effective: 2026-09-16
Scope: all existing and future chats, agents, workflows, repository changes, data/AI/intelligence work, frontend/UX, backend/platform engineering and external-data integrations.

## Objective
Bedrijfsgeheugen Powerhouse stays structurally ahead by continuously evaluating and adopting the best currently available techniques without trading away production safety, evidence, maintainability, cost discipline or canonical architecture.

## Non-negotiable rule
Every material task must use the best available current knowledge and technology that is relevant to the task. "Newest" never means blindly adopting the newest release. It means the newest proven or sufficiently evidenced option that materially improves one or more of: quality, capability, security, performance, maintainability, reliability, user experience, business impact or total cost.

## Mandatory scope
The rule covers at least:
- software engineering practices, languages, runtimes, libraries, frameworks and testing;
- frontend architecture, browser capabilities, accessibility, interaction patterns, motion and visual design;
- backend architecture, APIs, queues, eventing, edge/serverless and integration patterns;
- GitHub, CI/CD, supply-chain security, dependency governance and developer tooling;
- Supabase/Postgres, schema design, RLS, indexes, functions, realtime, storage, observability and migrations;
- Netlify build/runtime/deploy capabilities, caching, edge/runtime features and production readback;
- Notion knowledge architecture, documentation, agent instructions and canonical continuity;
- data engineering, semantics, lineage, quality, provenance, freshness and external data;
- AI models, multimodal capabilities, tools, agents, retrieval, evals, structured outputs, reasoning patterns and guardrails;
- forecasting, ranking, optimization, experimentation, causal/effect measurement and other intelligence algorithms;
- relevant current news, research, standards, regulations, platform changes and market/technology signals.

## Existing-state-first adoption loop
For every material change:
1. Read canonical current state, shared context, open obligations and prior learning first.
2. Determine the current authority and reuse existing capabilities before introducing anything new.
3. Check whether relevant technology, model, framework, platform feature, algorithm, data source or design practice has materially improved since the current implementation was selected.
4. Compare candidate options on evidence, compatibility, security, performance, maintainability, cost and business impact.
5. Classify the candidate as `PRODUCTION_READY`, `CONTROLLED_FRONTIER_EXPERIMENT`, `WATCH`, or `REJECT`.
6. Implement the smallest canonical change when the evidence justifies adoption.
7. Verify with appropriate unit/integration/contract/E2E/security/performance/eval/regression checks.
8. Promote only through the existing Powerhouse delivery authority and verify exact production identity/readback.
9. Write outcome, evidence, version/provenance, decision lineage and reusable learning back to the existing canonical Powerhouse memory.

## Frontier safety
Experimental or frontier technology may be used only when it is isolated and reversible. It requires:
- an explicit hypothesis and baseline;
- measurable success criteria;
- representative evaluation data;
- a feature flag, sandbox, preview lane or equivalent isolation where applicable;
- security/privacy/cost review proportional to risk;
- rollback or fallback to last-known-good;
- no silent replacement of an existing production authority;
- promotion only after evidence shows the candidate is better enough to justify operational complexity.

## Freshness and external evidence
Agents must use current external evidence when the task can materially benefit from it. Relevant evidence includes official release notes/documentation, standards, primary research, security advisories, provider roadmaps/status, reputable benchmarks and current market/platform signals. External evidence is advisory input until reconciled with Powerhouse constraints and production evidence.

Every external datum used for a material decision must carry, where meaningful: source/provenance, observation time or publication date, freshness, confidence and the decision it influenced.

## Model and algorithm governance
For AI/model/algorithm changes, record at minimum:
- exact provider/model/version or algorithm version;
- task and evaluation dataset/suite;
- baseline versus candidate quality;
- latency and cost where material;
- safety/truth/grounding failure modes;
- fallback behavior;
- calibration/threshold policy where relevant;
- production outcome after release.

A newer model is not automatically a better model for every task. Selection is task-specific and evidence-based.

## Dependency and platform currency
Powerhouse continuously treats deprecation, EOL, CVEs, unsupported APIs, stale SDKs, superseded platform features and compatibility drift as engineering signals. Urgent security/EOL items receive priority; non-urgent upgrades are batched or scheduled to minimize churn.

The target is not maximum version velocity. The target is minimum avoidable technical aging while preserving a stable, understandable production system.

## Design and frontend currency
Frontend work must compare against current browser/platform capabilities, accessibility standards, responsive interaction patterns and measurable user behavior. Visual novelty alone is insufficient. New interaction or design patterns must improve usability, clarity, conversion, accessibility or perceived/product performance without breaking accepted semantic/navigation baselines.

## Data and intelligence currency
New external sources or algorithms must integrate into the existing canonical data/intelligence graph. No parallel analytics truth, model store, customer graph, learning system or shadow database is allowed. Data quality, lineage, provenance, freshness, confidence, tenant boundaries and retention remain mandatory.

## Definition of Done
A state-of-the-art adoption change is complete only when:
- the comparison/evidence is recorded;
- the selected option is versioned and reproducible;
- required tests/evals/gates are green;
- exact production identity and behavior are read back where production is affected;
- rollback/fallback is valid;
- canonical docs/system map/decision lineage are updated;
- reusable learning is written back;
- no parallel authority was created.

## Permanent anti-patterns
Forbidden:
- chasing releases solely because they are newer;
- adopting benchmark claims without task-relevant evidence;
- replacing stable components without measurable benefit;
- introducing a second canonical store or agent memory;
- weakening security/tests/gates to make a frontier candidate pass;
- claiming "latest" without checking current evidence when currency matters;
- leaving an adopted experimental component unowned, unversioned or without rollback.
