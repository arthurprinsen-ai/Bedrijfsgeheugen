# Development Operating System

## Purpose
This is the canonical execution flow for Bedrijfsgeheugen changes across development, preview and production. It complements `AGENTS.md`, `docs/self-healing-agents.md`, `docs/outcome-obligations.md` and the executable `powerhouse-engineering-os-v1` contract in `config/powerhouse-engineering-os.json`.

## Mandatory sequence
1. Read `AGENTS.md`, this file, `docs/development-ledger.md`, `docs/self-healing-agents.md`, `docs/outcome-obligations.md`, the shared-agent-memory design and current Powerhouse Team Memory.
2. Run `node scripts/brain/chat-learning-preflight.mjs` and require `status: READY`.
3. Run `node scripts/brain/powerhouse-engineering-os.mjs --check` and require `ENGINEERING_OS_READY`.
4. Dedupe by fingerprint and reuse known fixes before exploring new hypotheses.
5. Materialize every expected result as an outcome obligation with owner, deadline, evidence policy, idempotency key and recovery policy.
6. Protect last-known-good production.
7. Reproduce with concrete build/runtime/deploy evidence.
8. Add or strengthen a regression gate before the repair where practical.
9. Apply the smallest reversible root-cause fix.
10. Verify candidate tests and exact preview artifact/SHA.
11. Red is non-terminal: iterate with new evidence; maximum two identical retries per hypothesis.
12. Promote a green candidate to production automatically through the existing production authority.
13. Verify exact production SHA/deploy, smoke/regression and protected metrics.
14. Reconcile expected obligations against verified outcomes. Technical success, an empty result set or `zero candidates` is not green when an outcome is expected.
15. If production regresses, rollback immediately to last-known-good and continue repair on the safe route.
16. Write ERROR/RECOVERY/IMPROVEMENT/MISSED_OBLIGATION/AUTO_REPAIR/PRODUCTION_PROMOTION/PRODUCTION_ROLLBACK to the repo ledger and shared learning.
17. Evaluate whether the verified outcome implies a reusable skill, guardrail, test, workflow or architecture improvement; promote only through the evidence gates below.

## Powerhouse Engineering OS golden path
Every material engineering change follows one shared sequence:

`CONTEXT -> SCOPE -> PLAN -> CHANGE -> TEST -> PREVIEW -> VERIFY -> PROMOTE -> PROD_READBACK -> WRITEBACK -> LEARN -> IMPROVE`

The machine-readable index is `config/powerhouse-engineering-os.json`; it does not replace component, delivery, outcome or learning authorities. It exists so every current/new agent or reopened chat can discover the same rules immediately and fail closed when those authorities drift.

Engineering rules:
- prefer the smallest coherent reversible change and explicit interfaces;
- reuse existing modules/helpers/workflows before adding another implementation;
- a new test is not protection until Required CI demonstrably executes it;
- tests should assert behavior/evidence instead of incidental wording or implementation text;
- frontend scope includes visual/layout/spacing/responsive/cross-browser/accessibility/performance/console/network/content/design-system drift where relevant;
- backend scope includes correctness/contracts/migrations/data integrity/security/RLS/auth/idempotency/concurrency/performance/cost/recovery where relevant;
- production/database behavior must be reconstructable from source control; no hidden dashboard-only authority;
- documentation, production evidence and learning writeback are part of delivery, not cleanup later.

Canonical engineering fingerprint: `powerhouse-engineering-os-v1`.

## Shared Learning & Team-of-Agents Contract
Canonical fingerprint: `powerhouse-shared-learning-architecture-evolution-v1`.

`SHARED-LEARNING` and `TEAM-OF-AGENTS` apply to all existing and future agents, chats and material workflows. Every agent works on the same canonical Powerhouse state and learning layer; local caches or conversation context are projections only and may never become a second durable truth.

Mandatory preflight before material work:
- read the current canonical architecture and Engineering OS;
- read Latest Verified State and open obligations relevant to scope;
- read bounded current shared team context and known failed approaches;
- resolve explicit task evidence separately from supportive team context;
- reuse an already verified fix/capability before exploring a new hypothesis;
- check current technology/provider/dependency evidence when currency materially affects the task.

Material outcomes must preserve enough lineage to reuse the learning: problem/symptom, root cause or strongest supported explanation, failed approach, chosen change, exact candidate identity, tests/gates, production readback, outcome, prevention rule, freshness/provenance/confidence and any remaining obligation.

Learning is deduplicated by fingerprint **before** persistent write and before context refresh. Append-only audit history and current operational projection remain separate: canaries, fixtures, false positives and healthy no-op outcomes do not pollute current team context. A genuinely new verified reusable learning refreshes the existing shared context immediately. Shared context never satisfies a missing explicit evidence requirement.

No second agent memory, learning database, architecture registry, queue, CRM, analytics truth or brain may be introduced when the existing Powerhouse authority can be extended.

## Skill Evolution
Skills include reusable agent instructions, prompts, diagnostic procedures, workflows, testing strategies, tooling patterns and operating procedures. Skills are versioned/evaluated capabilities, not ungoverned self-modifying prompts.

Promotion lifecycle:

`OBSERVE -> CLUSTER -> HYPOTHESIZE -> BASELINE -> CANDIDATE -> EVAL -> REVIEW -> PROMOTE_OR_ROLLBACK -> PROD_OUTCOME -> WRITEBACK`

A candidate skill improvement requires a current baseline, measurable success metric, representative evaluation set, compatibility with canonical contracts, relevant cost/latency/security/privacy review, rollback/fallback and post-promotion production observation. One anecdotal failure may trigger immediate containment for severity, but durable skill promotion still requires evidence. Failed candidates roll back and become reusable learning.

## Architecture Evolution
Architecture is an actively managed Powerhouse capability. It is continuously evaluated on correctness/reliability, security/tenant isolation, performance, maintainability/cognitive load, reuse/duplication, observability, deployability/rollback safety, testability, data integrity/lineage, cost/capacity, compatibility/migration burden, business impact and lead time.

Architecture candidates may be triggered by repeated incidents/workarounds, measurable bottlenecks, deprecation/EOL/CVEs, provider capability changes, repeated agent confusion about authority/boundaries, duplicate implementations/drift, materially better proven external techniques, or new business requirements that cannot be cleanly satisfied inside current boundaries.

Promotion requires comparison with the current architecture, measurable expected improvement, migration/compatibility analysis, security/privacy/cost review, representative tests or benchmarks, bounded rollout where appropriate, rollback/recovery, exact release identity, production readback and updated System Map/decision lineage/human documentation. A newer architecture is never promoted merely because it is newer; if a simpler local repair solves the problem, architecture remains unchanged.

The `LEARN -> IMPROVE` stage therefore means: inspect verified learning for a reusable improvement candidate, evaluate it against the current baseline and only then change a skill/guardrail/architecture through the same protected delivery path.

## State-of-the-Art Adoption Contract
Canonical fingerprint: `powerhouse-state-of-the-art-adoption-v1`.

This contract applies to **all existing and future chats, agents, workflows and material Powerhouse changes**. The objective is to stay structurally ahead by continuously evaluating and adopting the best currently available techniques without trading away production safety, evidence, maintainability, cost discipline or canonical architecture.

`Newest` never means blindly choosing the highest version number or most recent release. It means the newest proven, or sufficiently evidenced, task-relevant option that materially improves capability, quality, security, performance, maintainability, reliability, user experience, business impact or total cost.

Mandatory scope includes at least:
- software engineering practices, runtimes, libraries, frameworks and testing;
- frontend architecture, current browser capabilities, accessibility, interaction patterns, motion and visual design;
- backend architecture, APIs, eventing, edge/serverless and integrations;
- GitHub, CI/CD, supply-chain security, dependency governance and developer tooling;
- Supabase/Postgres schema design, RLS, indexes, functions, realtime, storage, observability and migrations;
- Netlify build/runtime/deploy capabilities, caching and production readback;
- Notion knowledge architecture, documentation, agent instructions and continuity;
- data engineering, semantics, lineage, quality, provenance, freshness and external data;
- AI models, multimodal/tool capabilities, agents, retrieval, evals, structured outputs and guardrails;
- forecasting, ranking, optimization, experimentation, causal/effect measurement and other intelligence algorithms;
- relevant current research, standards, security advisories, provider/platform changes and technology signals.

For every material task where technology currency can affect the result:
1. read canonical current state, shared context, open obligations and prior learning first;
2. reuse current Powerhouse capabilities and identify the existing authority;
3. check current external evidence from appropriate primary or authoritative sources;
4. compare relevant candidates on quality, capability, compatibility, security, performance, maintainability, reliability, cost and business impact;
5. classify candidates as `PRODUCTION_READY`, `CONTROLLED_FRONTIER_EXPERIMENT`, `WATCH` or `REJECT`;
6. implement only the smallest canonical change justified by evidence;
7. run task-appropriate tests/evals/security/performance/regression gates;
8. promote only through the existing protected delivery authority;
9. verify exact production identity/readback where production is affected;
10. write decision lineage, versions/provenance, outcome and reusable learning back to the existing Powerhouse memory.

Frontier or experimental technology requires an explicit hypothesis, baseline, representative evaluation, measurable success metric, isolation such as a feature flag/sandbox/preview lane where applicable, proportional security/privacy/cost review, and a rollback or fallback to last-known-good. It may never silently replace an existing production authority or weaken gates to pass.

When external evidence materially influences a decision, record where meaningful: source/provenance, observation or publication date, freshness, confidence and the decision influenced. Prefer official documentation/release notes, standards, primary research, security advisories, provider status/roadmaps and reputable task-relevant benchmarks.

AI/model/algorithm changes additionally record provider/model/algorithm version, evaluation suite, baseline comparison, latency/cost where material, safety/truth/grounding failure modes, fallback behavior, calibration/threshold policy where relevant and production outcome. A newer model is not automatically a better model for every task.

Treat deprecation, EOL, CVEs, unsupported APIs, stale SDKs, superseded platform features, compatibility drift and material new capabilities as engineering signals. The target is minimum avoidable technical aging, not maximum version churn.

No adoption may introduce a second canonical analytics truth, model store, customer graph, learning system, shadow database, queue, registry or agent memory. EXISTING-STATE-FIRST / REUSE-FIRST / CANONICAL-INTEGRATION / CLOSED-LOOP remain mandatory.

## Non-terminal status and resumed-work rule
This contract applies to **all new, existing, reopened and resumed Powerhouse chats, agents and work sessions**.

`DEELS LIVE` is an observational interim state, never a normal stopping condition. If parity gaps, migration drift, red gates, unverified production behavior, missing readback, missing writeback, documentation drift or any other technically resolvable obligation is known, the agent must keep working in the same session where technically possible until the complete affected chain is `LIVE & BEWEZEN`.

Mandatory rules:
- reopening an existing chat with an unresolved obligation means resuming unfinished work, not starting a fresh independent task;
- known parity gaps and Supabase migration drift are repair instructions, not acceptable end-state disclaimers;
- a merge to `main`, a green partial check, a successful deploy or HTTP 200 is not sufficient when the intended outcome is not fully verified;
- after every repair, rerun the relevant tests/gates, production/provider readback, parity/data-integrity checks and canonical writeback;
- close or supersede the deduplicated obligation only after verified evidence exists;
- write the resulting outcome, root cause, learning and prevention rule to the existing Powerhouse lineage and update human-readable documentation when the operating contract changed;
- an agent may stop short of `LIVE & BEWEZEN` only at an objective hard boundary: missing authority/access, unavailable external dependency, safety/security boundary, destructive/irreversible action requiring approval, paid-resource increase, or legally/financially binding action. That boundary must be recorded with exact evidence, one deduplicated open obligation and the first executable next action.

Canonical fingerprint: `powerhouse-live-proven-no-partial-stop-v1`.

## Parallel delivery sequence
`BRAIN-DELIVERY-v2` is the mandatory release envelope for repository development. Delivery is **independent delivery, shared intelligence**: changed scope is classified into declared lanes; non-conflicting lanes may develop and verify independently; synchronization is required only for actual changed-path, merge, contract or declared dependency conflict. Exact tested candidate identity is mandatory for promotion. BG169 remains production-promotion authority, BG168 material-outcome routing and BG167 refreshed current-state visibility.

## Fast branch and concurrent-main rule
`main` is expected to move continuously because publishers, agents and workflows can commit independently. A moving `main` is therefore **not** by itself a reason to rebuild, replay or recreate a feature branch.

Mandatory rules for every agent, new project chat/work session, GitHub workflow and repository automation that performs development:
- create a feature branch directly from the current `main`; branch creation is an O(1) Git ref operation and should take seconds, not minutes;
- prefer one atomic tree/commit for a bounded batch instead of serially rewriting many files through repeated API calls;
- after `main` moves, compare changed paths and mergeability;
- if feature paths and new-main paths do **not** overlap and GitHub reports the branch mergeable, continue using the already-tested feature SHA and merge it with the then-current `main`;
- do **not** recreate, replay or rebase a branch merely to make `behind_by=0` when drift is non-overlapping;
- synchronize/rebase only when there is an actual merge conflict or changed-path overlap that can affect the candidate;
- if another agent already implemented an equivalent fix on `main`, dedupe and reuse it instead of copying it again;
- exact production verification applies to the resulting merge commit, not to an artificial requirement that the feature head itself always contains every unrelated new `main` commit.

This rule exists because a previous portal migration repeatedly rebuilt a green branch while `main` was receiving unrelated commits; during the rebuild `main` moved again, creating avoidable minutes of delay and duplicate work. That failure mode is permanently prohibited by `config/brain-delivery-system.json`, `tests/brain-delivery-system.test.mjs` and shared team memory.

## Protected invariants
- `NO SILENT FAILURE`.
- `NO LOST OBLIGATION`.
- `GREEN MEANS OUTCOME VERIFIED`.
- `RED MEANS AGENTS KEEP WORKING`.
- `PARTIAL LIVE MEANS KEEP WORKING` unless an objective hard boundary is recorded.
- No secret/credential/permission changes without explicit authorization.
- Never weaken security controls.
- No destructive or irreversible data mutations.
- No paid-resource increases or legally/financially binding actions.
- Production must remain on last-known-good when a candidate is red.
- Exact deploy/commit identity is part of acceptance.
- Documentation and learning writeback are release requirements, not optional follow-up.

## Release gate
A candidate is green only when relevant tests pass, required knowledge files exist, preview is verifiably healthy, rollback is known and all obligations created by the change have either verified outcome evidence or an explicit valid hard boundary. Production is green only after the exact promoted SHA is verified in production, all technically resolvable obligations in the affected scope are closed, and the canonical runtime/learning/documentation writeback has been read back successfully.
