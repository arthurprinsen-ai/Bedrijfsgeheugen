---
name: powerhouse-delivery-concurrency
description: Use for GitHub delivery when multiple chats, agents, workflows or writers can move main concurrently or race at protected merge.
---

# Powerhouse Delivery Concurrency

Fingerprint: `delivery|merge-epoch|optimistic-cas|v1`.

## Goal

Keep development parallel, but make terminal landing deterministic. Main may move at any time. A green gate on an older main epoch is never enough by itself to authorize a protected merge.

## Mandatory protocol

1. Work in parallel while scopes do not conflict.
2. Before terminal merge, acquire one short-lived landing lease bound to:
   - obligation;
   - exact candidate head SHA;
   - exact current main SHA.
3. Re-read current main immediately before merge.
4. Require candidate head = tested head.
5. Require `behind_by = 0` for the landing candidate.
6. Require GitHub to report no merge conflict.
7. Require the landing lease to still match the same candidate head and main SHA.
8. If main moved after the gate, do not merge. Reconcile onto current main, preserve the full current-main union, rerun the required exact-head gates, then reacquire the landing lease.
9. Protected merge must use expected-head/CAS semantics. A failed CAS or conflict is recovery input, never a terminal failure.
10. After merge, continue through production readback, outcome evidence, learning writeback and skill projection.

## Parallel-agent rules

- One active executable candidate per obligation.
- Duplicate same-obligation PRs are superseded/closed; they never race independently.
- Integration is serialized only for the short terminal landing window, not for development.
- Non-overlapping agents keep working while another candidate owns the landing lease.
- Overlap is determined from changed paths, contracts, dependencies and mutable external resources.
- Main drift without terminal intent is informational; main drift during landing invalidates the landing proof.
- Never keep a stale green result authoritative after the main epoch changed.

## Prediction and prevention signals

Treat these as leading indicators before a conflict occurs:

- rising `behind_by`;
- more than one TERMINAL_DELIVERY candidate;
- duplicate Obligation-ID across open PRs;
- merge-base older than the gate main SHA;
- main moving during Required/BRAIN execution;
- repeated rebase/retest cycles for the same obligation;
- changed-path or contract overlap between terminal candidates.

When these signals appear, Powerhouse should prioritize the candidate closest to terminal completion, defer duplicate same-obligation writers, and serialize only the landing boundary.

## Incident rule

PR #2074 on 2026-09-18 is the reference incident: exact-head gates became green, main moved, and the candidate became 10 commits behind with a real merge conflict. The prevention rule is not “retry merge”; it is “green must be bound to a current main epoch plus a landing lease before protected merge.”


## User-facing terminal-state rule

Delivery ownership does not end when CI is queued/running, auto-merge is armed, branch protection is waiting, the merge is pending, deployment is pending, or production readback is pending. Those states are recoverable execution states inside the same canonical lineage.

The executing/recovering node must continue or resume until one of these is evidenced: `LIVE_BEWEZEN`, `ROLLED_BACK_GREEN`, or `BLOCKED_HARD_BOUNDARY`. Intermediate progress may be reported, but it may not transfer responsibility back to the user or require a “continue” prompt.

Canonical fingerprint: `delivery|no-pending-final-output|v1`.
Canonical authority: `brain/policies/powerhouse-agent-continuity-v1.json`.


## Borging closure invariant

Borging is not post-processing. When a delivery creates a canonical learning/prevention rule, the same lineage owns its durable writeback into the relevant documentation and skills and must prove that writeback on current main before terminal completion. A merged implementation with stale learning/skill surfaces is non-terminal.

Fingerprint: `delivery|borging-closure|material-writeback|v1`.

## Canonical connector/toolchain authority

Before choosing an external execution route, apply `powerhouse|toolchain-authority|composio-no-make|v1` from `.agents/skills/powerhouse-toolchain-authority/SKILL.md`.

Make is retired and forbidden as execution, orchestration, fallback or recovery. Use the canonical active stack instead: Composio where orchestration is needed; GitHub, Netlify, Notion, Supabase, Tavily, Buffer, DataForSEO, OpenArt, Placid, Google Search and Google Analytics for their specialist capabilities. Historical Make references are provenance only and must never reactivate authority.


## GitHub delivery state machine v1

Fingerprint: `github|delivery-state-machine|parallel-build-serialized-landing|v1`.

GitHub is an executable delivery state machine, not a chat archive, parking lot or second learning database.

- Every product PR carries exactly one `Obligation-ID`, `Delivery-Lane`, `Candidate-Type` and `Base-SHA`; `Supersedes` is absent/none or exactly one direct predecessor.
- Candidate identity is obligation + exact head SHA + main epoch. Branch names are secondary labels and may be rebuilt without creating a new obligation.
- Cheap gates run before expensive CI: metadata/schema, branch hygiene, classifier completeness, test-to-workflow coverage, static security and writer lease.
- Product WIP is conflict-aware: the WIP budget applies to candidates sharing an explicit conflict contract, while unrelated agents and branches do not consume each other's integration budget; docs/dependency maintenance stays outside product WIP.
- Exactly one terminal writer may exist for an obligation. Its lease binds owner, obligation, exact head and exact main epoch.
- Landing is allowed only when `behind_by=0`, the tested head is unchanged, required checks are green, the lease still matches, no newer canonical successor exists and the main epoch has not moved.
- A merge is non-terminal. The lineage must still prove main containment, deploy/promotion readback, runtime behavior, outcome evidence, learning projection and skill projection.
- Normal operation is parallel build + serialized landing. Do not create a fresh recovery PR merely because another chat or agent resumed the same obligation.

## Proven terminal closure authority

For fingerprint `github|delivery-state-machine|parallel-build-serialized-landing|v1`, terminal closure is now production-proven. Every merged obligation must continue through the canonical `Obligation Terminal Closure` workflow and may become `LIVE_BEWEZEN` only after main containment plus the existing Production Release Readback have succeeded. If canonical learning changed, the same lineage must also prove Powerhouse Skill Projection before lease release. The merge itself is never terminal evidence.


## Nonstarving admission under parallel main movement

Fingerprint: `github|delivery-admission|head-bound-ci-terminal-main-cas|v1`.

Admission and landing are different safety phases.

- Admission is bound to the canonical obligation and exact candidate head. A syntactically valid `Writer-Lease-Main-Epoch` remains provenance, but unrelated main movement alone must not fail admission or restart expensive CI.
- Writer-lease admission still fails closed on owner/scope/obligation/head drift.
- Current-main equality is enforced at the terminal landing boundary, not continuously during CI.
- Terminal merge remains strict: exact validated head, current lease epoch = current main, `behind_by=0`, mergeable=true, required checks green, no newer canonical successor, then expected-head/CAS merge.
- If main moves during CI, keep the existing exact-head evidence unless an actual conflict contract/path dependency invalidates it. Reconcile at landing or when impact analysis says the candidate is affected.
- Repeated sync → full rerun → sync loops caused only by unrelated main movement are delivery starvation and must be prevented, not normalized.

This refines `github|delivery-state-machine|parallel-build-serialized-landing|v1`: parallel build and CI remain useful while only the short landing boundary is serialized on current main.

## Canonical single-flight PR CI

Fingerprint: `delivery|agent-factory|single-flight-pr-gate|v1`.

For parallel chats and agents, runner capacity is protected by a single canonical PR orchestration rule:

- `Required test` is the canonical aggregate PR gate.
- Heavy verification belongs in reusable, change-scoped lanes and must not be duplicated as independent automatic PR entrypoints.
- The aggregate gate must never poll a sibling workflow that repeats coverage already available in its selected lanes.
- Specialist workflows may remain manual/reusable for diagnostics, recovery, or explicit deep verification.
- Pricing/SEO/browser/database checks are selected by affected scope; unrelated contracts are skipped.
- `cancel-in-progress: true` remains latest-head-wins for PR work.
- Independent conflict contracts may build/test in parallel; only overlapping integration pressure and terminal landing are serialized.
- Never solve CI fan-out by adding more runners before redundant workflow entrypoints are removed.

Canonical learning: `brain/learning/agent-factory-single-flight-ci-20260925-v1.json`.

## Mandatory material-run closure gate

Fingerprint: `powerhouse|material-run|closure-artifacts|required|v1`.

Every material delivery candidate must carry canonical Brain learning, an append-only activity/development ledger event, and human-readable documentation in the same lineage before Required may pass. This is machine-enforced by `scripts/brain/material-writeback-closure-guard.mjs`; missing closure evidence is a delivery failure, not optional documentation debt. Automatic skill projection and terminal production/readback remain mandatory downstream.

## Terminal recovery diagnostics under parallel delivery

Fingerprint: `github|chat-terminal-recovery|exact-head-observability|v1`.

Concurrency safety includes diagnostic correctness:
- never let an expected early consumer exit under `pipefail` create a false producer failure; prefer process substitution for bounded selection;
- a failed workflow with zero jobs is syntax/parse evidence until disproven, not a reason to rebuild the candidate;
- exact-head merge authority is incomplete until BRAIN, Powerhouse CodeQL and Required are all terminal green for the same head;
- for `github_main` evidence, `production_observed_sha` must equal `main_sha` exactly;
- preserve HTTP status + sanitized response body on terminal evidence writes so retries are cause-directed rather than blind.

Canonical source: `brain/learning/2026-09-19-chat-github-terminal-recovery-prevention-v1.json`.
- During same-lineage current-main reconciliation, never create a transient state where the open PR branch equals `main` and the candidate delta is reapplied later. Construct the full current-main tree plus candidate delta first, create one commit with current main as parent, then move the branch ref atomically. Transient equality can auto-close the PR and is a recoverable delivery defect.
- For GitHub tree-based reconcile, `base_tree_sha` is mandatory and must equal the tree SHA of the exact current-main parent. Never create a replacement root tree from only the touched files. Before moving the branch ref, enforce expected changed-file/deletion budgets; repository-wide amplification is fail-closed and must leave main untouched.
## Predictive landing coalescing

Fingerprint: `delivery|predictive-landing-coalescing|v1`.

To reduce repeated rebase/retest churn without weakening `behind_by = 0`:
- allow independent candidates to build and prove their own exact heads in parallel;
- do not reconcile a healthy candidate merely because main moved while its gates are still running;
- immediately before terminal landing, read current main and overlap; if the candidate is behind, rebuild exactly once onto the freshest current-main tree, preserving the full union and bounded delta;
- if several ready candidates touch disjoint paths, order landings by shortest remaining terminal critical path and downstream fan-out cost; after each landing, reconcile only the candidates that became behind and are next to land;
- forecast repeated-main-movement risk from recent merge velocity and gate duration; delay only the short landing lease, never the development work;
- keep one canonical candidate per obligation and never create duplicate PRs to escape a moving main.



## External side-effect single-writer rule

Fingerprint: `side-effect|atomic-claim-before-provider|v1`.

GitHub landing serialization is not enough for external actions. Any workflow that can publish, send, create, charge, mutate an external system or otherwise produce a non-trivial side effect must acquire a canonical compare-and-set claim before the provider call. The claim key must bind the business obligation plus the specific channel/resource/date or equivalent idempotency domain. Concurrent losers stop without side effects. A retry is permitted only when evidence proves the previous attempt did not cross the external side-effect boundary; otherwise provider reconciliation is mandatory before any retry.

Reference incident: social publisher duplicate publication on 2026-09-19. Root cause was two runs reading `content_ready` before either persisted delivery state. Prevention is enforced in `powerhouse-social-publisher` and its social-learning regression suite.

## Universal error + live learning closure v2

Fingerprint: `powerhouse|error-live|semantic-learning-closure|required|v2`.

This is mandatory for every current and future chat, agent, workflow and Powerhouse execution node.

- Every material error is written durably in the same obligation lineage with a stable fingerprint, concrete symptom/failure class, root cause (or an explicit still-open root-cause obligation), failed approaches where relevant, fix/recovery, regression/test evidence and a machine-actionable prevention rule.
- A known fingerprint must be reused before inventing a fresh diagnosis. Repeating the same error without reusing or strengthening the prior prevention is itself a learning failure.
- Presence of a learning file is not sufficient. Required must fail closed when the learning is checkbox-only and lacks semantic root-cause, prevention and evidence content.
- Every material delivery also carries activity/development ledger evidence and human-readable documentation in the same lineage.
- After protected merge, `LIVE_BEWEZEN` is forbidden until production/provider readback is verified, outcome evidence is present, canonical learning is durable, automatic skill projection is green/read back, and terminal evidence releases the writer lease.
- Terminal evidence is part of the learning loop: live success, recovery and failure outcomes must remain discoverable by the next worker; no chat-local success claim may outrank the canonical evidence.
- If a prevention can be machine-enforced, prefer code, tests, constraints, CI/runtime assertions or policies over prose-only guidance.

Canonical enforcement: `scripts/brain/material-writeback-closure-guard.mjs`, `.github/workflows/required-test.yml`, `.github/workflows/powerhouse-skill-projection.yml`, and `.github/workflows/obligation-terminal-closure.yml`.


## CI admission / runner single-flight invariant

Fingerprint: `github|ci-admission|single-flight-runner-budget-v1`.

Parallel development is encouraged; duplicate execution is forbidden.

- One active Required run per PR across native `pull_request` and recovery `workflow_dispatch`.
- One active BRAIN delivery run per PR across those same trigger types.
- Repository-wide recovery may run on `main`, explicit dispatch and the bounded schedule, never on every feature-branch push.
- Superseded same-PR/ref work uses `cancel-in-progress: true`; healthy current-head work is reused, not redispatched.
- Auxiliary PR workflows require bounded PR/ref concurrency and path-scoped admission where scope is statically knowable.
- Multiple independent obligations may execute simultaneously; a second executable lineage for the same Obligation-ID is forbidden.
- Serialize only the mutable landing boundary. Keep independent development and gates parallel.

Optimize time-to-terminal-proof per runner/credit/energy unit: reuse, dedupe, cheap admission first, then bounded parallel expensive work.


## User-visible interaction production proof

Fingerprint: `pricing-toggle-i18n-runtime-20260924-v1`.

When the defect is an interaction, delivery proof must exercise the interaction. Marker-presence, source inspection, successful build, exact SHA deployment and generic route health are necessary but not sufficient.

Required for pricing/i18n-class defects:
- state-change assertions for the affected toggle/tab/control;
- mobile production browser coverage when the defect was reported on mobile;
- static localized public language navigation rather than provider-dependent runtime switching;
- English route/content verification and explicit rejection of the known runtime translation failure state;
- exact interaction proof on the deployed production SHA before `LIVE_BEWEZEN`.

Production browser verifier: `tools/site-shell/verify-pricing-i18n-production.mjs`.


## Queue-pressure and fan-out admission

Fingerprint: `github|actions-queue-pressure-governor|predict-before-dispatch|v1`.

Concurrency includes runner capacity. Before any write/dispatch that can trigger CI, compute total non-terminal pressure (`queued + in_progress + pending + waiting + requested`) and projected fan-out. At >=8 total active or >=5 queued, allow only essential single-flight work and batch related writes. At >=12 total active or >=8 queued, open the circuit: no new recovery/optional runs. Never intentionally create >3 new runs from one action. One canonical PR per obligation and one active Required/BRAIN instance per PR/head are hard limits. Proven obsolete queued runs may be reaped after 60 seconds; proven obsolete in-progress runs after 300 seconds. Age alone never authorizes cancellation.

## Obsolete Actions-run identity

Fingerprint: `github|actions-obsolete-run-identity|sha-bound|v1`.

Queue/run authority is bound to the exact run SHA, not merely to a branch name. A stale queued or in-progress run may be reaped only when its identity is provably obsolete: closed PR, PR-head mismatch, branch-head mismatch, missing non-main branch, or old main SHA. In-progress cleanup additionally requires at least 1800 seconds without update.

Unexpected candidate-head movement is fail-closed. Before a new head inherits authority, compare it to the last trusted head and verify that the diff is exactly the intended recovery delta. Never silently follow a moved branch.


## Fast obsolete-run drainage invariant

Fingerprint: `github|actions-obsolete-run-fast-drain|v1`.

Runner capacity is a development resource and stale queue occupancy is a delivery defect. Once a GitHub Actions run is proven obsolete by exact identity (closed PR, PR-head mismatch, branch-head mismatch, missing non-main branch, or old main SHA), queued work is eligible for cancellation after a short 60-second grace period and obsolete in-progress work after 300 seconds without authoritative identity. The recovery supervisor runs every five minutes, may reap up to 100 proven-obsolete runs per cycle, and opens its recovery circuit at 12 total non-terminal runs so recovery cannot amplify saturation. Never cancel healthy current-head work merely to reduce the count.


## Queue census identity invariant

Fingerprint: `github|actions-pressure-census|same-universe-pagination|v1`.

Raw active pressure and the obsolete/provider-zombie deductions must be computed from the same fully paginated status universe. Never subtract a paginated stale/zombie count from an unpaginated recent-run sample. Count `queued`, `in_progress`, `pending`, `waiting` and `requested` with pagination before deriving effective pressure. Clamp-to-zero is only a safety guard, never a substitute for census correctness.


## Production i18n fail-closed landing rule

Fingerprint: `i18n-production-fail-closed-20260924-v1`.

An i18n candidate may land only if the exact head preserves production fail-closed semantics: `STATIC_I18N_NETWORK=1` cannot fall back to untranslated `/en/*` output. Provider resilience is allowed only around retries/backoff, never around the success criterion. Terminal proof must include exact production SHA plus visible-English browser evidence.


## Stable auxiliary-workflow concurrency identity

Fingerprint: `github|auxiliary-pr-workflow|stable-logical-flight-key|v1`.

For every supersedable PR/ref workflow, `cancel-in-progress: true` only works when the concurrency group represents a reusable logical flight. Never use `github.run_id`, timestamps, random IDs or other per-run values in that group. Prefer `github.event.pull_request.number` for PR context with `github.ref_name` as the stable manual/ref fallback.

Canonical regression: `tests/brain-actions-pr-single-flight-v1.test.mjs`.
Canonical incident learning: `brain/learning/2026-09-25-pricing-hero-single-flight-recovery-v1.json`.


## Main-push fan-out budget

Fingerprint: `main-push-fanout-budget-20260925-v1`.

Post-merge automation is affected-scope aware:
- closure-only changes (docs, tests, workflow governance, agent skills, Brain learning) do not trigger a fresh Netlify production deployment/readback by themselves;
- mixed commits still deploy whenever any runtime/site path is present;
- domain post-merge checks use path-scoped push admission;
- duplicate post-merge test suites already proven by Required are removed from every-main execution;
- stale same-ref security/SEO work uses stable concurrency identity with `cancel-in-progress: true`;
- Main Write Integrity is the intentional exception and observes every main write.

Canonical learning: `brain/learning/main-push-fanout-budget-20260925-v1.json`.
