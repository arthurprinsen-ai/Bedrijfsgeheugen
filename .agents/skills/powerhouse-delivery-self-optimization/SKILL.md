---
name: powerhouse-delivery-self-optimization
description: Use when optimizing Powerhouse delivery for first-time-right execution, proactive failure prevention, low-friction parallel delivery, and terminal proof without avoidable retries.
---

# Powerhouse Delivery Self-Optimization

Fingerprint: `delivery|first-time-right|terminal-preflight|v1`.

## Purpose

Make the delivery system predict likely failure modes before they happen. Optimize for fewer avoidable retries, stale-head reconciliations, merge conflicts, queue churn and incomplete delivery while preserving exact-head gates, protected merge and production readback.

## Anticipate-before-act contract

Before every material write, reconcile, retry, merge or promote step:

1. Refresh current `main`, current PR head, merge-base, ahead/behind, mergeability and active workflow state.
2. Build a short failure forecast for the next delivery horizon:
   - main likely to move before merge;
   - overlapping open PR/writer-lease scope;
   - hot shared surfaces;
   - missing workflow/classifier coverage;
   - metadata/admission mismatch;
   - scheduler/capacity risk;
   - post-merge deploy/readback dependency;
   - learning/skill projection still required.
3. Choose the narrowest action that minimizes expected rework while preserving all safety invariants.
4. Re-read authoritative state immediately before any irreversible action. Never act on cached mergeability, cached head or old CI evidence.
5. After state movement, re-plan from the new epoch instead of replaying an old plan.

## First-time-right rules

- Validate the PR delivery envelope with the same canonical parser and allowed-value policy used by admission before expensive CI starts.
- Require `Obligation-ID`, `Delivery-Lane`, `Candidate-Type`, `Base-SHA`, and the full writer-lease tuple when terminal delivery is active.
- Every new executable test must have workflow/classifier coverage in the same candidate.
- Preflight the candidate contract against the regression assertions that will judge it; schema/test drift must be found before remote CI.
- A cancelled GitHub job without a concrete failing assertion is scheduler/concurrency recovery input, not evidence that product code is wrong.
- Retry only the missing cancelled job on the same exact head before considering code mutation.
- Inspect main drift and shared-surface overlap before reconciliation; preserve the full current-main union and keep the same obligation/PR lineage.
- Prefer a dedicated skill/projection over editing a concurrently owned hot shared skill when the knowledge can be represented without changing authority.
- Never spawn a duplicate PR merely because main moved. Reconcile or rebuild the same obligation lineage from fresh main according to the writer-lease/supersession policy.
- Green evidence belongs to an exact head. Reuse it only when the exact candidate identity and applicable gate contract remain unchanged.
- Plan terminal delivery all the way through protected merge, deploy/readback, outcome evidence and learning/skill writeback before starting the mutation.

## Predictive telemetry

Track per obligation:

- `metadata_admission_reject_count`
- `orphan_test_preflight_count`
- `scheduler_cancel_retry_count`
- `main_epoch_reconcile_count`
- `shared_surface_overlap_count`
- `hot_surface_avoidance_count`
- `green_gate_reuse_ratio`
- `time_to_terminal_proof`
- `stale_state_prevented_count`
- `predicted_collision_avoided_count`
- `pre_ci_contract_defect_count`
- `duplicate_lineage_prevented_count`

Repeated friction is a generator/template/scheduling defect to eliminate, not normal noise. Prediction quality must itself be calibrated: record predicted failure modes, observed outcomes, false positives and misses, then tighten the planning rule.

## Decision rule

Use the narrowest safe repair:
- metadata reject -> repair metadata/template;
- orphan test -> add workflow/classifier coverage;
- stale test/schema expectation -> align implementation and contract before CI;
- cancelled job without assertion -> retry the missing job;
- main moved -> refresh, forecast and reconcile same lineage;
- merge-base diverged materially -> rebuild only the obligation delta from fresh main and supersede stale lineage;
- hot shared surface -> avoid it when a dedicated projection can carry the knowledge;
- concrete failing assertion -> repair only that root cause;
- post-merge/readback dependency missing -> keep ownership and continue terminal delivery, never return it as user follow-up.

## Agent behavior

The agent is expected to think one or more state transitions ahead. It must ask: “what is most likely to invalidate this candidate next?” and remove that preventable cause before spending another CI/deploy cycle. Reactive recovery remains the fallback; proactive prevention is the default.


## Proven production lineage

Status: `ACTIVE_PROVEN`.

- Source PR: #2114
- Candidate head: `87ac4eb16ae5e78ac54f45603f06b5086858c80c`
- Protected merge: `f76bfbbccbc6dd256590dad1e95bc75985d9a351`
- Required: success
- Unified BRAIN: success
- CodeQL: success
- Main readback: verified on 2026-09-18

Terminal proof includes canonical learning-to-skill writeback and readback; delivery is not complete before that projection is proven current.

## Canonical connector/toolchain authority

Before choosing an external execution route, apply `powerhouse|toolchain-authority|composio-no-make|v1` from `.agents/skills/powerhouse-toolchain-authority/SKILL.md`.

Make is retired and forbidden as execution, orchestration, fallback or recovery. Use the canonical active stack instead: Composio where orchestration is needed; GitHub, Netlify, Notion, Supabase, Tavily, Buffer, DataForSEO, OpenArt, Placid, Google Search and Google Analytics for their specialist capabilities. Historical Make references are provenance only and must never reactivate authority.

## Capacity, candidate-type and owner-head authority

Fingerprint: `delivery|capacity-owner-authority|v1`.

- `WAITING_CAPACITY` / `FINISH_EXISTING_WORK_FIRST` is deliberate backpressure, not a code failure. Do not mutate product code to clear it.
- Candidate type is behavioral metadata: use `promotion` only for actual promotion/transport work; use `implementation` for implementation/learning changes and `recovery` only for genuine recovery lineage.
- Promotion serialization must never be bypassed by relabeling a real promotion; fix misclassification only when the candidate semantics are genuinely different.
- When another active owner keeps advancing the same obligation head, treat the newest owner head as authoritative. Older heads and their green runs become audit evidence, not merge authority.
- Never create writer-head thrash by force-updating a branch that an active canonical owner is already reconciling. Observe first; intervene only on concrete failure or owner stagnation.
- Capacity backpressure, head supersession and owner activity are scheduling signals. Persist them so future planning can avoid starting expensive work that cannot enter terminal delivery yet.

Additional metrics:
- `capacity_backpressure_count`
- `promotion_serialization_block_count`
- `candidate_type_reclassification_count`
- `owner_head_supersession_count`
- `writer_head_thrash_avoided_count`


## Successor PR coverage integrity

Fingerprint: `delivery|successor-pr|coverage-integrity|v1`.

When a PR or branch supersedes an earlier lineage:
- compare predecessor and successor changed-file sets; do not rely on squash ancestry;
- inspect predecessor-only deltas across implementation, executable tests, workflow registration, classifier coverage, security/governance, docs and skills;
- require every predecessor-introduced executable regression test to remain wired into an applicable canonical workflow/classifier unless explicitly retired with evidence;
- treat `Supersedes` as lineage metadata, not completeness proof;
- do not close cleanup as safe until successor/main containment **and** coverage integrity are proven;
- if a required predecessor-only delta is found, classify the obligation as `RECOVERABLE_INCOMPLETE` and repair the current canonical lineage before terminal completion.

Reference incident: #2129 → #2148 silently lost the backend registration of `tests/supabase-instagram-media-job-materializer-v1.test.mjs`; #2158 restored it and production-readback proved the exact merged SHA.

## First-time-right terminal diagnostics

Fingerprint: `github|chat-terminal-recovery|exact-head-observability|v1`.

Predict and remove these avoidable delivery failures before another CI cycle:
- shell pipeline can generate SIGPIPE because a bounded consumer exits early under `pipefail` → replace with process substitution or equivalent;
- workflow can fail before job creation because YAML parses an unquoted Actions expression containing significant `: ` text → quote/validate the complete expression;
- terminal `github_main` proof can drift because observed SHA is only “verified” → require the exact invariant `production_observed_sha === main_sha`;
- terminal API error handling hides the server rejection body → capture status + sanitized response body, then fail closed;
- Required can outpace critical sibling workflows → aggregate existing exact-head BRAIN and Powerhouse CodeQL terminal outcomes instead of launching duplicate heavy CI.

These are cost, latency and correctness signals. A blind retry without new diagnostic evidence is a self-optimization failure.
- For policy/skill regression tests, assert semantic invariants rather than incidental prose word order; brittle wording regex is avoidable CI churn.

Canonical source: `brain/learning/2026-09-19-chat-github-terminal-recovery-prevention-v1.json`.
- During same-lineage current-main reconciliation, never create a transient state where the open PR branch equals `main` and the candidate delta is reapplied later. Construct the full current-main tree plus candidate delta first, create one commit with current main as parent, then move the branch ref atomically. Transient equality can auto-close the PR and is a recoverable delivery defect.
- For GitHub tree-based reconcile, `base_tree_sha` is mandatory and must equal the tree SHA of the exact current-main parent. Never create a replacement root tree from only the touched files. Before moving the branch ref, enforce expected changed-file/deletion budgets; repository-wide amplification is fail-closed and must leave main untouched.

## Fast terminal delivery / predictive critical path

Fingerprint: `delivery|fast-terminal|critical-path|v2`.

Speed is a governed engineering objective, not permission to skip evidence. Every material chat/agent must minimize **time-to-terminal-proof** while preserving exact-head, security, protected merge and production/provider readback.

Mandatory:
- compute the likely delivery critical path before mutating: admission → classifier → affected cheap tests → independent expensive gates → landing → production readback → writeback;
- run cheap fail-fast metadata/schema/classifier/security checks before expensive browser, full-build, CodeQL or provider work;
- fan out independent expensive gates as soon as cheap admission is green; do not serialize unrelated work;
- never redispatch a healthy exact-head gate merely because another gate is queued/running;
- do not chase every main movement while CI is healthy; keep building/testing in parallel and reconcile **once at the terminal landing boundary** onto the freshest current main when `behind_by > 0` or overlap requires it;
- terminal reconciliation must be full-current-main-union, bounded by expected changed-file/deletion budgets, followed by exact-head re-proof;
- if a canonical production-readback run is already terminal but non-green, immediately attempt authoritative current-production descendant proof instead of waiting/retrying the known failed run;
- prefer event-driven continuation and bounded polling; polling windows must have an explicit evidence purpose and small cadence;
- reuse deterministic caches/artifacts where supported, keyed by exact candidate SHA plus dependency/lockfile identity; never reuse stale evidence as gate proof;
- predict hot-surface collisions from changed paths, obligation/lease ownership, historical gate duration and main-movement velocity, and serialize only the short conflicting boundary;
- record delivery latency and avoidable-work metrics so future planning can choose the lower-cost/faster path automatically.

Required metrics: `time_to_first_failure`, `time_to_required_green`, `time_to_protected_merge`, `time_to_production_proof`, `queue_wait_seconds`, `duplicate_gate_dispatch_prevented_count`, `main_reconcile_count`, `known_failed_readback_wait_avoided_seconds`, `critical_path_seconds`.



## Explicit obligation supersession hygiene

Fingerprint: `github|hygiene|explicit-obligation-supersession|v1`.

Repository cleanup must collapse duplicate executable PRs without guessing semantic equivalence. A newer open PR may auto-close an older open PR only when both carry the exact same non-empty `Obligation-ID` and the newer PR explicitly declares `Supersedes: <older PR number>`. Same-title, same-files, temporal proximity, or heuristic similarity are never sufficient.

The repository hygiene control plane applies this cleanup with a bounded per-run budget before candidate-family and orphan-branch cleanup. This reduces duplicate CI, queue pressure and stale WIP while preserving unique work fail-closed.


## GitHub queue amplification guard

Fingerprint: `github|queue-amplification|path-scope-and-push-scope|v1`.

Treat queued runner work as a governed resource. Global recovery supervisors must not run on every feature-branch push when pull-request exact-head workflows plus scheduled recovery already cover the same obligation. Domain workflows must trigger only for files/migrations they actually consume. Cross-cutting integrity checks belong in one cheapest existing owner lane and must not force unrelated heavyweight suites.

Before adding a workflow trigger, ask:
1. does this changed path materially affect this workflow's contract;
2. is another existing gate already the canonical owner of the same invariant;
3. can the check be moved to the cheapest already-triggered lane;
4. will the trigger create duplicate exact-head work or queue amplification?

A broad trigger is a regression unless it has explicit cross-cutting ownership evidence.


### Obsolete-run cancellation

When a canonical explicit successor closes its predecessor, repository hygiene must also cancel nonterminal Actions runs for the predecessor head. Cancellation is bounded by the central resource budget; terminal/completed runs are evidence and are never rewritten. This keeps obsolete exact-head work from occupying runner capacity after canonical ownership has moved.
