# Powerhouse Shared Learning & Architecture Evolution — Design

Date: 2026-09-16
Status: proposed-for-implementation
Fingerprint: `powerhouse-shared-learning-architecture-evolution-v1`
Parent architecture: `powerhouse-engineering-os-v1`
Delivery authority: `BRAIN-DELIVERY-v2`

## 1. Purpose

Extend the existing Bedrijfsgeheugen Powerhouse so every current and future agent, chat and material workflow behaves as one learning team on one canonical architecture. Problems, fixes, outcomes, evidence and reusable lessons must continuously improve the same system. Skills and architecture must evolve automatically when current evidence and measured production outcomes show that a change is materially better.

This design does not create a second memory, agent fabric, CRM, architecture registry, queue, analytics store or learning database. It extends the existing Engineering OS, Brain chat-learning contract, shared context projection, Canonical State/Company Graph, AgentWork/evidence lineage, Supabase runtime state and Notion human-readable projections.

## 2. Non-negotiable principles

The following principles apply to all existing and future agents/chats/workflows:

- EXISTING-STATE-FIRST
- REUSE-FIRST
- CANONICAL-INTEGRATION
- CLOSED-LOOP
- SHARED-LEARNING
- TEAM-OF-AGENTS
- EVIDENCE-BEFORE-DONE
- STATE-OF-THE-ART-EVIDENCE-BASED-ADOPTION
- SMALLEST-SAFE-CHANGE
- EXACT-CANDIDATE-IDENTITY
- GREEN-MEANS-OUTCOME-VERIFIED
- RED-MEANS-KEEP-WORKING

No agent may create an isolated durable truth or private operational memory. Local context and caches are projections only.

## 3. Canonical lifecycle

Every material task follows one lifecycle:

`CONTEXT -> SCOPE -> PLAN -> CHANGE -> TEST -> PREVIEW -> VERIFY -> PROMOTE -> PROD_READBACK -> WRITEBACK -> LEARN -> IMPROVE`

`IMPROVE` does not mean uncontrolled self-modification. It means evaluate whether the verified outcome implies a reusable improvement to a test, guardrail, prompt, skill, workflow, component boundary, interface, dependency, architecture rule or operational procedure.

## 4. Shared learning contract

### 4.1 Mandatory preflight

Before material execution, each agent/chat must read a bounded current packet containing:

- current canonical architecture and Engineering OS contract;
- relevant Latest Verified State;
- open obligations and known blockers;
- relevant recent team learning/current shared context;
- exact explicit evidence references required by the task;
- known failed approaches and prevention rules;
- current dependency/model/provider/platform currency signals when materially relevant.

Shared context is supportive evidence and never substitutes for an explicit required evidence reference.

### 4.2 Material outcome capture

A material outcome record must distinguish at least:

- `SUCCESS`
- `IMPROVEMENT`
- `RECOVERY`
- `ERROR`
- `NO_ACTION`
- `BLOCKED_HARD_BOUNDARY`
- `EXPERIMENT_RESULT`

The record must include, where applicable:

- task/context fingerprint;
- component(s) touched;
- symptom/problem;
- root cause or strongest supported causal explanation;
- failed approach(es);
- chosen fix/change;
- exact candidate identity;
- tests and gate evidence;
- production readback;
- outcome and business/technical impact;
- regression/prevention rule;
- reusable learning fingerprint;
- freshness, provenance and confidence;
- follow-up obligation if not fully closed.

### 4.3 Dedupe before write

Learning fingerprinting and dedupe happen before persistent write and before shared-context refresh. Exact duplicates are coalesced into audit history without producing a new current learning or unnecessary refresh.

### 4.4 Projection rule

Append-only audit history and current team context remain separate. Canaries, test fixtures, false positives and healthy no-op outcomes never pollute the current shared team projection.

### 4.5 Event-driven refresh

A genuinely new verified reusable learning immediately refreshes the existing shared team context so subsequent agents see it without waiting for a periodic batch.

## 5. Skill evolution contract

Skills include reusable agent instructions, prompts, workflows, test strategies, tooling procedures, diagnostic playbooks and implementation patterns.

A skill change must pass this promotion loop:

`OBSERVE -> CLUSTER -> HYPOTHESIZE -> BASELINE -> CANDIDATE -> EVAL -> REVIEW -> PROMOTE_OR_ROLLBACK -> PROD_OUTCOME -> WRITEBACK`

### 5.1 Promotion requirements

A candidate skill improvement must have:

- reproducible trigger or evidence cluster, not one anecdotal failure unless severity justifies immediate containment;
- current baseline behavior;
- explicit success metrics;
- representative evaluation cases, including known regressions and adversarial/edge cases where relevant;
- tool/model/harness/version identity when relevant;
- latency/cost/security/privacy impact when material;
- compatibility with canonical architecture and contracts;
- rollback/fallback;
- post-promotion production observation.

### 5.2 Automatic optimization boundaries

The system may autonomously propose and implement low-risk reversible skill improvements inside existing authority. It must not autonomously cross hard boundaries involving secrets/permissions, weakening security controls, irreversible destructive data actions, paid-resource increases, or legal/financial commitments.

A failed evaluation or production regression rolls back the candidate and writes the failure as reusable learning.

## 6. Architecture Evolution contract

Architecture is treated as an actively managed capability, not static documentation.

### 6.1 Architecture fitness dimensions

Material architecture choices are continuously evaluated against:

- correctness and reliability;
- security and tenant isolation;
- performance and latency;
- maintainability and cognitive load;
- reuse and duplication reduction;
- observability and diagnosability;
- deployability and rollback safety;
- testability;
- data integrity and lineage;
- cost/capacity/FinOps;
- compatibility and migration burden;
- business impact and lead time.

### 6.2 Architecture change trigger

An architecture candidate may be generated by:

- repeated incidents or workaround clusters;
- measurable performance/cost/reliability bottlenecks;
- dependency deprecation/EOL/CVE;
- provider/platform capability changes;
- repeated agent confusion caused by unclear authority or boundaries;
- duplicate implementations or drift;
- materially better proven external technique;
- new business requirement that cannot be cleanly satisfied within current boundaries.

### 6.3 Architecture promotion gate

No architecture change becomes canonical solely because it is newer. Promotion requires:

- current-state evidence and problem statement;
- comparison against the existing architecture;
- measurable expected improvement;
- migration/compatibility analysis;
- security/privacy/cost assessment;
- representative tests/benchmarks;
- feature flag, shadow, canary or bounded migration where appropriate;
- rollback/recovery path;
- exact release identity and production readback;
- updated System Map, ADR/decision lineage and human-readable documentation.

Where a simpler local fix solves the problem, the architecture must not be changed.

## 7. State-of-the-art evidence loop

The existing `powerhouse-state-of-the-art-adoption-v1` remains the only technology-currency authority. This design consumes it rather than replacing it.

For material currency-sensitive decisions, agents prefer current primary sources such as official documentation, release notes, standards, security advisories and primary research. External evidence is recorded with provenance, publication/observation date, freshness and confidence.

Frontier/experimental techniques stay isolated until representative evaluations show benefit over the current baseline and a safe rollback exists.

## 8. Enforcement in Engineering OS

`config/powerhouse-engineering-os.json` will be extended with:

- `SHARED-LEARNING` and `TEAM-OF-AGENTS` principles;
- `IMPROVE` as the post-learning lifecycle stage;
- shared-learning contract metadata;
- skill-evolution contract metadata;
- architecture-evolution contract metadata;
- explicit learning/evolution authorities;
- release requirements for learning/skill/architecture writeback.

`scripts/brain/powerhouse-engineering-os.mjs` will fail closed when required contract sections, authorities or CI wiring are missing/drifted.

The bounded `--packet` output will expose the effective shared-learning and evolution rules to downstream agents.

## 9. Test strategy

The existing Engineering OS regression lane will be extended, not duplicated.

Contract tests must cover at least:

- all mandatory principles and lifecycle stages;
- canonical authority existence;
- no parallel memory/learning authority;
- preflight context requirement;
- known-fix reuse before experimentation;
- explicit-evidence separation from supportive context;
- dedupe-before-write;
- no-op/canary filtering;
- event-driven context refresh after new verified learning;
- skill candidate baseline/eval/rollback requirements;
- architecture candidate comparison/migration/rollback requirements;
- hard-boundary enforcement;
- Required CI wiring.

Behavioral/eval tests should assert semantic contracts and outcomes, not incidental prompt wording or file layout.

## 10. CI/CD and production evidence

GitHub remains source/review/protected-merge authority. Existing Required test stays the release gate; reusable deterministic checks should be centralized rather than copied across workflows.

A green repository test is necessary but cannot prove external platform controls or production behavior. GitHub protection, Netlify deployment identity, Supabase runtime/schema state and other external controls require direct current readback where relevant.

No change is `LIVE & BEWEZEN` without exact candidate identity plus production/readback evidence for the affected runtime path.

## 11. Canonical writeback surfaces

After implementation, the same change must be projected into existing authorities only:

- Engineering OS/config and validator;
- Development Operating System;
- Engineering Constitution;
- Canonical System Map & Agent Update Contract;
- Powerhouse Loop Constitution;
- Powerhouse Menselijk Handboek;
- Master Build, Borging & Go-Live Register;
- Latest Verified State;
- Agent Activity Log / existing learning lineage where applicable.

Notion remains a human-readable projection/audit surface and not deployment identity authority.

## 12. Observability and metrics

The evolution loop should track enough evidence to judge whether it improves the system. At minimum, where measurable:

- repeated-incident rate;
- recurrence after prevention rule;
- mean time to diagnose/recover;
- duplicate-solution rate;
- reuse rate of known fixes/components;
- regression escape rate;
- agent preflight compliance;
- closure/writeback compliance;
- skill-eval pass/regression rate;
- architecture change lead time;
- rollback frequency;
- latency/cost/capacity deltas;
- user/business outcome where applicable.

Metrics inform improvement but never replace direct task evidence.

## 13. External evidence used for this design

Current primary-source guidance supports the design choices:

- GitHub documents reusable workflows as a way to centralize deterministic repeatable logic and avoid duplicated workflow configuration: https://docs.github.com/en/actions/reference/workflows-and-actions/reusing-workflow-configurations
- GitHub documents required status checks/rulesets as enforceable merge gates: https://docs.github.com/en/enterprise-cloud@latest/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets
- OpenAI's 2026 evaluation guidance emphasizes evaluating the complete agentic system, including model, reasoning setting, tools, harness, safeguards, budgets and validity checks rather than judging isolated outputs: https://openai.com/index/trustworthy-third-party-evaluations-foundations/

These sources are evidence inputs, not independent architecture authorities; Powerhouse remains canonical.

## 14. Definition of done

This work is complete only when:

1. the design is approved;
2. implementation plan is written;
3. Engineering OS/config/validator/tests are updated on a feature branch;
4. all relevant Required tests are green on the exact candidate;
5. protected merge to `main` succeeds;
6. affected production/runtime surfaces have direct current readback where applicable;
7. canonical Supabase/learning state is verified where runtime writeback is affected;
8. all required Notion/System Map/Handbook/Register projections are updated and re-read;
9. the new team-learning/evolution rule itself is written as reusable learning;
10. terminal status is one of `LIVE & BEWEZEN`, `DEELS LIVE`, `GEBLOKKEERD`, `NIET GEDAAN` with explicit open obligations.

## 15. Explicit non-goals

- No second agent memory.
- No new standalone learning database.
- No uncontrolled self-modifying production code.
- No blind latest-version upgrades.
- No architecture churn without measured benefit.
- No replacement of explicit human/system hard boundaries.
- No declaration of success based only on documentation or CI.