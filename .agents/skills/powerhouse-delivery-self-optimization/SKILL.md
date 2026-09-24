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

## Specialist workflow path-scope discipline

Fingerprint: `github|ci-path-scope|specialist-fanout-v1`.

Specialist workflows must subscribe only to their owned implementation, tests and schema surfaces. Do not use broad `supabase/migrations/**` triggers in a specialist workflow merely to obtain generic migration safety; that proof belongs in the canonical Supabase/Required gates. Remove duplicate path entries, keep bounded PR/ref concurrency, and treat unnecessary workflow starts as runner/credit/energy waste.

When adding a migration-triggered specialist workflow:
- prefer stable semantic filename patterns such as `*linkedin*.sql`, `*revenue*.sql` or the owned function directory;
- use a broad migration glob only when every migration is genuinely in-scope and document why;
- add a regression that fails if the trigger widens unintentionally.
- wire every directly-read runtime/function directory explicitly into the specialist workflow path filter; do not rely on unrelated schema globs as a proxy.
- use one PR/ref single-flight concurrency key without event-type splitting when event type is not a distinct delivery lineage, and bound auxiliary job runtime with an explicit timeout.


## Squash-merge terminal lineage proof

Fingerprint: `github|terminalizer|squash-tree-equivalence-v1`.

Post-merge terminal proof must not assume the candidate commit is an ancestor of the merge commit. GitHub squash merges create a new commit, and branch cleanup may remove the candidate ref before the terminalizer runs.

Mandatory:
- fetch the candidate SHA explicitly before lineage validation;
- accept direct ancestry when present;
- otherwise accept only exact candidate-tree == merge-tree equivalence as squash-merge containment proof;
- require the merge SHA itself to be contained in current `origin/main`;
- fail closed when neither ancestry nor exact tree equivalence can be proven;
- record the lineage proof mode in terminal evidence so later readback can distinguish `ancestor` from `squash_tree_equivalent`.


## Supabase provider runtime terminal truth

Fingerprint: `delivery|terminal-supabase-provider-readback|v1`.

A website/main descendant is **not** sufficient production proof for changes under `supabase/functions/<slug>/`.

Mandatory:
- every changed Supabase Edge Function must have explicit provider readback before terminal `LIVE_BEWEZEN`;
- terminal PR metadata must contain one line per changed function in the exact form `Terminal-Supabase-Provider-Readback: function=<slug>;version=<positive-int>;runtime_sha256=<64hex>`;
- the evidence must come from the active Supabase provider runtime after deployment, not from repository source, preview, merge state or website release state;
- missing, stale or incomplete provider evidence is `RECOVERABLE_INCOMPLETE`, never terminal success;
- agents must deploy/read back the exact current-main function, append the provider version/hash to the same PR lineage, then resume terminal closure;
- provider-runtime truth must remain distinct from Netlify/website production truth.

Reference incident: PR #2465 was marked `LIVE_BEWEZEN` while the active `powerhouse-social-publisher` runtime still contained `RuntimeState/runtime_state`. Direct provider readback exposed the mismatch; Supabase v26 was then deployed from exact main and verified with `CurrentState/current_state`.


## Durable provider readback evidence

Fingerprint: `delivery|provider-readback|durable-terminal-evidence|v1`.

Provider-runtime proof is not complete when it exists only in PR prose. For every terminal delivery that changes `supabase/functions/<slug>/`:
- parse the exact function/version/runtime SHA evidence from the canonical PR lineage;
- include those readbacks in the OIDC-authenticated terminal payload;
- bind them into the terminal payload hash;
- persist them in append-only `brain_delivery_evidence.evidence.provider_readbacks`;
- require durable Supabase readback to return `provider_readback_verified=true` before `LIVE_BEWEZEN`;
- reject missing, duplicate, malformed, non-ACTIVE or hash-invalid provider identities fail-closed.

This complements direct provider inspection: the deployment/readback actor establishes provider truth; the canonical control plane immutably binds that truth to the exact terminal obligation and main SHA.


## Exact-head merge admission; generic status contexts are not authority

Fingerprint: `delivery|exact-head-required-workflow|no-generic-context-merge|v1`.

A GitHub branch-protection status named `test`, mergeability, or a stale green check is never sufficient merge authority.

Before every protected merge, the executing agent/writer must independently prove on the **current PR head SHA**:
- the canonical `Required test` workflow run for that exact SHA is completed with `success`;
- canonical BRAIN and CodeQL are completed with `success` when applicable;
- any fail-closed domain workflow relevant to the mutation has not completed red;
- the PR head has not moved since those checks were read.

If Required is queued/in-progress, if the head moved, or if a relevant Supabase security/preview workflow is red, merge is forbidden even when GitHub reports the PR as mergeable.

Reference incident: PR #2475 merged at head `539a9a934d11f6373636da6144a38e76b8f28e46` while its Supabase Security Contract and Supabase PR Preview were red and Required was still in progress. The generic protected context name `test` was therefore not adequate evidence of canonical Required completion.


## Production migration identity mirroring

Fingerprint: `delivery|supabase-migration-identity|production-mirror|v1`.

When a Supabase migration has already been applied in production, production migration history is the canonical identity. The repository must mirror the exact production `version` and `name` before terminal success.

Mandatory:
- compare migration version, name, and effective contract semantics;
- never mutate production migration history just to fit a stale repo filename;
- if a direct production apply generated a different version, rename/reconcile the repository migration to that exact production version;
- when multiple applied versions share the same semantic migration name, identify the latest effective applied version whose statements match the current production contract; never stop at the first matching name;
- reject repository filenames that represent superseded production identities for the same semantic migration;
- treat version/name/semantic drift as recoverable incomplete state, not `LIVE_BEWEZEN`.


## Problem-library delivery prevention — 24 september 2026

Fingerprint: `delivery|problem-library|stale-main-duplicate-obligation|v1`.

Learning uit Powerhouse 50:
- een mislukte preview op current main bewijst niet dat de feature stuk is wanneer een geïsoleerde exact-delta preview vanaf de laatste bewezen productie-baseline groen is; classificeer eerst inherited main regression versus feature regression;
- iedere nieuwe executable regression test moet vóór remote CI onder een bestaande delivery-lane namespace vallen; voor Brain/backend tests is `tests/brain-*` de voorkeursroute;
- nooit parallelle PR's met dezelfde `Obligation-ID` laten bestaan; duplicate obligation is governance-noise en blokkeert admission;
- wanneer automation een successor PR aanmaakt, behandel de nieuwste canonieke obligation-owner als authority en sluit stale duplicaten pas na containment-check;
- skill/learning/change/ledger writeback hoort in dezelfde lineage als de feature en moet vóór terminal completion aanwezig zijn.

Doel: stale-main regressies, unclassified tests en duplicate-obligation thrash niet opnieuw laten leiden tot onnodige rebuilds of foutieve productdiagnoses.


## Queue forecast before mutation

Fingerprint: `github|actions-queue-pressure-governor|predict-before-dispatch|v1`.

The anticipate-before-act forecast includes current queued/in-progress/pending/waiting/requested runs plus projected new runs. Soft thresholds are 12 active / 10 queued; hard thresholds 20 / 20; projected fan-out budget is 6. Under pressure prioritize: exact-head reuse -> dedupe -> batch writes -> skip optional lanes -> reap proven orphaned stale queue -> dispatch only missing critical single-flight work. Never use a fresh PR, fresh commit series or broad retry as a queue escape mechanism.

## Workflow structural-anchor preservation

Fingerprint: `github|workflow-structural-anchor|preserve-tested-order|v1`.

A syntactically valid GitHub Actions edit can still be a regression when canonical tests intentionally assert neighboring job keys or structural anchors. Before inserting controls such as `timeout-minutes`, concurrency, permissions or conditions, inspect the contract tests for that workflow. If semantics allow, place the new key without disturbing an already-tested anchor. Never dismiss a structural test as cosmetic when it protects release-control composition.
## Problem Radar delivery learnings — 24 september 2026

Fingerprint: `delivery|problem-radar-first-time-right|v1`.

Observed avoidable retries and permanent prevention:
- missing `Base-SHA` in the PR envelope blocked admission: validate all required delivery metadata before first remote CI;
- material implementation without Brain learning + activity ledger blocked closure: create learning, ledger and human docs in the same candidate before opening/refreshing the PR;
- learning without `evaluation.historical_replay` failed canonicalization: bind every material learning to an executable regression/historical replay before projection;
- a green merge did not imply current production: compare provider `commit_ref` with feature merge/current main before making a live claim;
- when production commit is newer than the feature merge, use ancestry to prove feature inclusion;
- when exact-current-main promotion is required, use the canonical Production Source Snapshot rather than a second deploy mechanism.

Preflight these conditions before consuming a full CI/browser cycle.

## GitHub control-plane payload and reconcile-race prevention

Fingerprint: `delivery|github-api-buffer-pr-reconcile-race|v1`.

- GitHub API collectors that enumerate many PRs/files must use an explicit bounded process-output buffer; Node `execFileSync` defaults are not safe for a growing repository control plane.
- A buffer overflow that includes valid JSON in stdout is an execution-envelope failure, not evidence that the returned PR is malformed.
- Persist only a sanitized bounded error summary; never dump an entire open-PR payload as the diagnostic.
- During full-main-union reconciliation, avoid exposing an intermediate branch state that is byte-identical to base. GitHub may auto-close the PR as zero-diff.
- If a canonical PR is auto-closed during such a transient state, replay the preserved obligation delta, verify the branch head, reopen the same PR, refresh Base-SHA, and re-enable auto-merge. Never create a duplicate obligation PR solely because of this race.

## Runner leak prevention

Fingerprint: `delivery|runner-leak|job-timeout|required|v1`.

- Internal retry loops are insufficient protection against a hung browser, child process, package install or provider readback.
- Every long-running browser verification and production readback job must also define a job-level `timeout-minutes`.
- Timeout expiry is fail-closed evidence, not success; preserve logs/artifacts and route it into recovery learning.
- Prefer bounded jobs that release hosted runners predictably over indefinite verification that starves unrelated protected delivery.
- Current guard: `tests/brain-delivery-runner-leak-timeout-v1.test.mjs`.

### Do not use PR reopen/close as runner cancellation

Fingerprint: `delivery|runner-recovery|no-pr-churn-cancellation|v1`.

Reopening a closed PR can enqueue a new PR-scoped workflow run, but it is not a reliable way to terminate an already running reusable-workflow child job. Therefore:
- never use PR reopen/close churn as the primary mechanism to reclaim runner capacity;
- keep superseded PRs closed;
- prevent leaks with job-level timeouts and workflow concurrency before execution gets stuck;
- when cancellation APIs are unavailable, classify remaining stuck historical jobs as external runtime debt and keep current delivery fail-closed rather than mutating unrelated PR state.

## Production readback single-flight

Fingerprint: `delivery|production-readback|single-flight-supersession|v1`.

Production readback verifies current deployment truth. Therefore a newer `main` push supersedes an unfinished readback for an older main commit unless a specific historical audit contract explicitly requires both.

Mandatory:
- canonical production readback workflows use a stable concurrency group for the production target;
- `cancel-in-progress: true` for obsolete current-state readbacks;
- retain immutable artifacts from completed runs, but do not let stale in-progress readbacks consume runner capacity;
- combine single-flight concurrency with job-level timeouts;
- regression coverage must assert both the timeout and concurrency contract.

### Concurrency contract migrations must migrate regressions

Fingerprint: `delivery|concurrency-contract|regression-migration|required|v1`.

When a workflow concurrency invariant changes intentionally, every regression that asserts the old value must be migrated in the same candidate. A stale regression is not evidence that the new runtime contract is wrong.

Required:
- change runtime contract and its historical assertion together;
- preserve the intent of the test while updating the expected invariant;
- never weaken the runtime fix merely to satisfy stale test text;
- include the migrated regression in canonical learning evidence.

### Imported contract must match runtime representation

Fingerprint: `delivery|imported-contract|runtime-derivation-required|v1`.

When a canonical contract exports relative route/state identifiers but a runtime consumer works with absolute URLs or another transformed representation, the consumer must derive that representation explicitly before use. An import-presence test alone is insufficient; regressions must verify the runtime derivation used by the failing path.

## Netlify linked-deploy Skipped fallback

Fingerprint: `delivery|netlify-skipped|fallback-authority|v1`.

- Netlify `state=error` with `error_message=Skipped` is not production success, but it is also not equivalent to a failed provider build.
- When a linked deploy is explicitly skipped, continue only to the already-authorized canonical exact-source deployment transport.
- Do not introduce a second deploy authority or silently mark the skip green.
- Real Netlify error states remain fail-closed and preserve provider diagnostics.
- Production completion still requires provider `ready`, `production`, and exact `commit_ref`.
- Regression: `tests/brain-netlify-linked-skipped-fallback-v1.test.mjs`.



## Pricing/i18n terminal recovery composition

Fingerprint: `delivery|pricing-i18n|terminal-composed-contract|v1`.

When pricing or public-i18n delivery fails, optimize for the first proven failing layer instead of repeatedly mutating the candidate.

Mandatory order:
1. classify source/build/runtime/provider/control-plane failure;
2. repair only the concrete failing layer;
3. bind the repair to an executable historical regression;
4. keep the exact candidate head immutable while checks are merely queued/pending;
5. require material writeback completeness before expensive terminal proof;
6. merge through protected gates;
7. prove provider production identity;
8. prove the actual pricing lifecycle/plan/billing and locale interaction in a browser;
9. persist terminal evidence and release the writer lease.

A green result at any intermediate layer is not permission to skip later layers. Do not create parallel recovery PRs or deploy authorities unless the canonical lineage is provably unrecoverable.

## Production browser DOM geometry + real pointer

Fingerprint: `delivery|browser-readback|dom-geometry-real-pointer|v3`.

When exact production, route rendering and product-specific readiness are proven but Playwright locator auto-waits fail on `waitFor(visible)`, `scrollIntoViewIfNeeded` or `boundingBox()`:
- do not classify the application as broken from locator auto-wait alone;
- prove control visibility with computed `display`, `visibility`, `opacity` and non-zero `getBoundingClientRect()`;
- use DOM `scrollIntoView({block:'center', behavior:'instant'})` only for positioning;
- derive click geometry from `getBoundingClientRect()` inside page evaluation;
- perform the interaction with `page.mouse.click` at the measured center so it remains a real pointer event;
- genuine hidden/zero-size controls stay fail-closed;
- never substitute `force:true` or DOM `.click()`;
- retain semantic postconditions after the click.
Regression: `tests/brain-pricing-production-dom-geometry-pointer-v1.test.mjs`.

## Browser readiness must include the concrete pointer target

Fingerprint: `delivery|browser-readiness|target-presence-before-pointer|v1`.

A product-level readiness marker is necessary but not always sufficient for a real-pointer production proof.

For interaction verifiers:
- couple readiness to the concrete target element required by the next interaction;
- prefer a bounded `page.waitForFunction` that proves both runtime readiness and `document.querySelector(target)` presence;
- once that condition is true, use direct DOM reads for computed visibility, scroll and geometry when Locator auto-wait is the observed failure class;
- keep a real pointer event for the interaction itself;
- fail explicitly if the target disappears between readiness and pointer geometry;
- do not hide genuine missing controls with `force:true`, DOM `.click()`, or indefinite Locator waits.

Reference: pricing production lifecycle control recovery, run `36056415545`.

## Content-addressed runtime cache identity

Fingerprint: `delivery|static-runtime-cache|content-addressed-key|required|v1`.

For static JavaScript/CSS that establishes product runtime readiness or interaction behavior:
- never rely on a date/time query key that can outlive later asset mutations;
- derive the public cache-busting key from the exact asset content identity (Git blob SHA prefix is acceptable);
- regression must calculate that identity from file bytes and assert the HTML reference matches it;
- production content proof must assert the same key;
- Every build/transform/restoration path that can inject or restore the runtime tag must use the same key;
- if exact provider deployment is green but a runtime readiness marker is absent, inspect HTML/asset cache identity before mutating interaction logic or weakening the verifier.

Reference incident: pricing rescue runtime remained referenced as `v=20260924-0750` after later JS mutations, causing exact new HTML to be compatible with a stale cached runtime.

## Regression-contract drift after canonical verifier changes

Fingerprint: `delivery|regression-contract-drift|canonical-verifier|v1`.

When a canonical implementation/verifier is intentionally replaced and a new regression test codifies that replacement:
- search for older tests that assert the superseded mechanism;
- treat mutually contradictory assertions as test-contract drift, not as an implementation failure;
- update stale tests in the same recovery lineage so all tests enforce one canonical mechanism;
- never weaken semantic postconditions merely to make CI green;
- preserve fail-closed safety conditions and real production interaction requirements.
