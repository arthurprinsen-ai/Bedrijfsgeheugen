---
name: powerhouse-continuity
description: Use when materially operating, changing, debugging, recovering, documenting, or handing off Bedrijfsgeheugen Powerhouse work across chats, agents, workflows, repositories, providers, or interrupted execution.
---

# Powerhouse Continuity

## Core principle

Every material chat or agent is an intrinsic execution node in one canonical Powerhouse loop. Local chat state is never authority.

The canonical contract is `brain/policies/powerhouse-agent-continuity-v1.json`.

## Required behavior

Before material work:
- enforce `CURRENT_STATE_BEFORE_WORK`;
- enforce `REUSE_BEFORE_BUILD`;
- enforce `NO_AGENT_STARTS_FROM_SCRATCH`;
- read current truth, open obligations, relevant learning and the existing delivery lineage;
- compute only the missing delta.

During execution:
- stay on one canonical obligation/candidate lineage;
- repair root causes, not symptoms;
- never create a parallel brain, truth store, queue, PR or replacement workflow when the existing canonical route can continue;
- preserve exact-head identity, idempotency and security/truth gates.

Before terminal completion:
- prove the relevant tests/gates;
- merge/deploy/promote where applicable;
- read back production/provider truth;
- record outcome/value, root cause, regression and prevention;
- complete canonical writeback so the next run resumes from the written state.

`LIVE & BEWEZEN` requires evidence. Code, commit, PR, deploy-start, queued CI, timeout or chat/model stop are not completion.

## Recovery

Unexpected interruption means recovery, not restart. Resume from the last verified checkpoint and reconcile already-proven side effects before mutating again.

## Quick reference

| Situation | Required action |
|---|---|
| Existing knowledge or prior fix | Reuse it first |
| Search returns nothing | Treat as unknown, not proof of absence |
| CI fails | Read the first concrete failing assertion and fix only that cause |
| Main moves | Reconcile on the same lineage; re-prove exact head |
| Production/provider action | Read back the exact result |
| New learning | Write it canonically and make it discoverable |

## Common mistakes

- Treating chat memory as the source of truth.
- Starting a fresh design because prior state was not immediately visible.
- Calling a change done at commit/PR/deploy-start.
- Adding a regression that required CI never executes.
- Recording a fix without the reusable prevention rule.

## Canonical references

- `brain/policies/powerhouse-agent-continuity-v1.json`
- `brain/learning/chat-agent-intrinsic-loop-node-2026-09-18.json`
- `brain/learning/2026-09-18-merge-epoch-concurrency-guard-v1.json`
- `.agents/skills/powerhouse-delivery-concurrency/SKILL.md`
- `docs/brain/chat-agent-intrinsic-loop-node.md`
- `tests/brain-powerhouse-universal-agent-learning-writeback.test.mjs`

## External worker / connector boundary recovery

- Never treat a chat/tool safety boundary as a Powerhouse database outage without proving both separately.
- If direct ad-hoc SQL shape is rejected by the host but the canonical service-role RPC is callable, use the existing bounded RPC; never bypass atomic claim/CAS semantics with table writes.
- Provider work must be durable before dispatch: atomically claim one canonical job first, persist worker identity/attempt, then call the provider, then write back only the exact provider asset URL/metadata through the bounded completion route.
- A provider generation returning PENDING/RUNNING is a recoverable incomplete state, not failure and not completion. Persist/resume by canonical job + provider history identity; never generate a duplicate merely because a chat/run stopped.
- Provider-specific format constraints are checked before generation. If a chosen model cannot satisfy the canonical contract, switch to a compatible allowed model/provider without weakening the contract.
- Final media truth remains verifier-owned: producer/worker may never synthesize SHA, dimensions, Mira PASS, identity PASS, publication PASS, or LIVE_PROVEN.
- Historical sent items with republish_forbidden remain immutable; recovery creates no duplicate publication.

- When the user explicitly selects a model inside an already-required provider (for example OpenArt Gemini Omni), persist the model/history ID on the already-claimed canonical job and supersede the prior in-flight candidate logically; never create or claim a second Powerhouse job. Only the persisted current provider history may advance completion.


## Fast delivery and recovery invariants

These rules are mandatory for every chat/agent that creates, repairs or promotes repository changes:

- Parallelize independent specialist work, but serialize only the integration boundary for overlapping paths, contracts or mutable resources.
- Treat `obligation + canonical branch + exact head SHA` as delivery authority. A PR number is transport metadata and may be reopened/replaced without changing the canonical obligation.
- During `TERMINAL_DELIVERY`, bind one immutable `Writer-Lease-Head`. Non-owners must defer. Any unexpected head mutation is fail-closed until the lease moves to recovery and is explicitly rebound.
- Never cancel a healthy current-head job because the PR/head is old. Recovery is progress-aware and may retry only missing starts or genuinely stale queued critical work.
- For Required/BRAIN retries on one exact head, only the newest attempt is authoritative. Older cancelled/failed attempts remain audit evidence and must never override a newer healthy attempt.
- Optional or unrelated queued workflows must never trigger Required/BRAIN redispatch.
- Every new executable regression path requires classifier co-change in the same candidate before expensive CI. An unclassified regression is a delivery defect, not a reason to bypass the classifier.
- When main moves without overlap and the candidate remains mergeable, keep the tested candidate. Do not rebuild merely to chase main.
- When main reconciliation is required, preserve the full current-main union from the merge-base. Latest-commit-only overlays are forbidden because they can silently drop earlier main changes.
- Allocate final mutable identities at integration, not independently in parallel workers. For Supabase migrations, the rolling integrator owns final timestamp/version allocation and verifies uniqueness before expensive CI.
- Never open a duplicate same-obligation recovery PR merely because CI is queued, a run was cancelled, or PR metadata is stale. Reuse and repair the canonical lineage first.
- A protected merge is not enough. Terminal completion still requires production/provider readback, outcome/value evidence, learning/prevention writeback and next-agent discoverability.
- If a candidate was merged before all intended pre-merge gates became terminal, treat that as a governance incident: prove post-merge main/readback immediately and tighten merge protection so the pattern cannot recur.

### Canonical incident fingerprints

- `delivery|same-lineage|parallel-writer-head-thrash-v1`
- `delivery-recovery|progress-aware|v1`
- `migration-version-allocation|rolling-integrator|v1`
- `delivery-classifier|cochange-required|v1`
- `delivery-attempt-authority|latest-critical-attempt|v1`
- `moving-main|full-main-union|v1`
- `delivery|merge-epoch|optimistic-cas|v1` — terminal landing authority is valid only for the exact tested head on the exact current-main epoch; any main movement invalidates landing proof and requires same-lineage reconciliation/re-proof.


## LinkedIn predictive sales cockpit

When working on the Revenue Command Center / LinkedIn sales cockpit, reuse the live predictive-v2 cockpit and its existing Revenue & Growth Core. The canonical reusable product rule is: **sales decision surface, not passive reporting dashboard**.

Mandatory:
- reuse the existing cockpit instead of creating a parallel CRM, queue, sales brain or dashboard;
- prioritize who-now / why-now / next-best-action / expected value;
- show buying-window, relationship, company-intent or forecast signals only when canonical evidence exists;
- never accept the generic LinkedIn feed as an actionable source;
- preserve no-auto-send unless a separate canonical automation contract explicitly authorizes sending;
- feed observed outcomes back into the canonical revenue-learning loop;
- preserve fast search/focus/keyboard/mobile interaction patterns;
- require protected merge plus exact production deploy/readback identity before claiming LIVE & BEWEZEN.

Canonical fingerprint: `linkedin-sales-cockpit-predictive-sales-os-v1`.
Canonical skill reference: `docs/superpowers/skills/linkedin-sales-cockpit-predictive-v2.md`.


## Automatic learning → skill projection

Fingerprint: `powerhouse-learning-skill-auto-projection-v1`.

Canonical learning is always the authority. The skill layer is a derived execution projection and may never become a second truth source.

For every material learning, incident, root cause, prevention rule, outcome or delivery lesson:
- project it automatically through `scripts/brain/powerhouse-skill-projection.mjs`;
- deduplicate by learning fingerprint and deterministic source digest;
- prefer explicit `skill_targets`; otherwise use deterministic domain routing;
- reconcile all existing `brain/learning/**/*.json` so older durable learning is included;
- make the current projection available through chat-learning preflight;
- projection drift must fail closed when a projection is missing, stale or orphaned;
- require projection readback before `LIVE & BEWEZEN`, `LIVE_PROVEN` or `FULFILLED`.

A repository learning write without current skill projection is `LEARNING_WRITTEN_SKILL_SYNC_PENDING`, not terminal completion. Manual SKILL.md edits are only for durable operating principles; incident knowledge remains canonical in Brain learning and is consumed through the dynamic projection.

## No pending-status final handoff

Fingerprint: `delivery|no-pending-final-output|v1`.

For every material Powerhouse task, queued/running CI, an enabled auto-merge, an open PR, a protected-merge wait, deploy-in-progress or production-readback-pending state is **internal execution state**, never a final answer to the user.

Mandatory behavior:
- do not end with “auto-merge staat aan”, “de laatste gate loopt”, “branch protection wacht nog”, “ik claim nog geen LIVE & BEWEZEN”, or equivalent pending-status handoff;
- continue or resume the same canonical lineage automatically through gates → protected merge → deploy/promote → production/provider readback → outcome → learning/prevention writeback;
- intermediate status may be shown only while execution continues and must not transfer ownership back to the user;
- if a run/chat/tool stops, the next capable node resumes from the canonical checkpoint without asking the user to say “ga door”;
- only `LIVE_BEWEZEN`, `ROLLED_BACK_GREEN`, or an evidenced `BLOCKED_HARD_BOUNDARY` is a valid final user-facing state;
- `BLOCKED_HARD_BOUNDARY` is reserved for a genuinely non-autonomous next step such as missing external permission/credential, a destructive/irreversible decision, security control, paid-resource escalation, or legally/financially binding action.

The node that starts or recovers delivery retains ownership until terminal proof exists. Auto-merge is a mechanism, not a handoff.


## Borging closure is material writeback

A request to borg, log, document or update Powerhouse/skills is itself material work. Do not treat documentation or a skill edit as a side note. The closure must remain in the same canonical lineage and reach: learning writeback → ledger/documentation → relevant skill projection → regression evidence → protected merge → main/provider readback.

Canonical fingerprint: `delivery|borging-closure|material-writeback|v1`.

## Canonical connector/toolchain authority

Before choosing an external execution route, apply `powerhouse|toolchain-authority|composio-no-make|v1` from `.agents/skills/powerhouse-toolchain-authority/SKILL.md`.

Make is retired and forbidden as execution, orchestration, fallback or recovery. Use the canonical active stack instead: Composio where orchestration is needed; GitHub, Netlify, Notion, Supabase, Tavily, Buffer, DataForSEO, OpenArt, Placid, Google Search and Google Analytics for their specialist capabilities. Historical Make references are provenance only and must never reactivate authority.

## Runner-capacity / queue saturation recovery

Fingerprint: `delivery|runner-capacity|autorecovery|v1`.

When exact-head Required/BRAIN/CodeQL checks are queued because GitHub Actions runner capacity is unavailable or saturated:
- classify the state as external execution-capacity blockage, not code failure;
- preserve the exact candidate, writer lease, auto-merge intent and obligation lineage;
- do not create a duplicate recovery PR merely to escape the queue;
- do not weaken branch protection, skip Required/BRAIN/CodeQL, or admin-merge around the gate;
- retry only cancelled/failed recovery-supervisor work when a bounded retry is safe;
- keep queued healthy current-head checks authoritative and let the same lineage resume automatically when runner capacity becomes available;
- log the boundary and latest verified checkpoint so the next capable agent can continue without user prompting;
- `BLOCKED_HARD_BOUNDARY` is valid only while external runner capacity prevents execution and no safe autonomous action remains; it never converts the obligation into done.

Queue pressure is transport/runtime capacity state, not evidence that the candidate is wrong.

## Runner-capacity terminal closure

Fingerprint: `delivery|runner-capacity|live-closure|v1`.

When recovering a delivery lineage after queue saturation, metadata rejection, or main drift:
- validate `Obligation-ID`, `Delivery-Lane`, `Candidate-Type` and `Base-SHA` before expensive CI;
- when reconciliation is required, rebuild from current main using full-main-union semantics instead of overlaying only the latest main commit;
- preserve all previously proven learning, borging and regression coverage; recovery is additive;
- require exact production/provider commit readback before claiming `LIVE_BEWEZEN`;
- treat fail-closed admission or classification errors as learning signals to repair in the same lineage, never as justification to bypass gates.

Canonical proof: `brain/learning/2026-09-18-runner-capacity-live-closure-v1.json`.


## Successor completeness / branch-cleanup guard

Fingerprint: `delivery|successor-pr|coverage-integrity|v1`.

A closed predecessor and a merged successor do not by themselves prove that the predecessor is disposable. Before declaring a lineage fully superseded or deleting its branch:
- compare predecessor-only changed-file deltas against successor and current `main`;
- verify executable-test → workflow/classifier coverage explicitly;
- preserve required security, governance, documentation and skill deltas;
- treat squash-diverged ancestry as non-authoritative for content completeness;
- keep the obligation recoverable until every required predecessor-only delta is either present on current `main` or explicitly retired with evidence.

Reference production recovery: PR #2158 / merge `7d0442b517c80c51f69ebcaba6328d731a309459`.

## GitHub obligation terminalization

Fingerprint: `github|delivery-state-machine|parallel-build-serialized-landing|v1`.

When repository delivery reaches merge, continuity ownership remains active. Resume the same obligation until the canonical `Obligation Terminal Closure` workflow proves main containment, canonical production/runtime readback, applicable learning-to-skill projection, immutable terminal evidence and writer-lease release. Only the resulting machine-readable terminal state (`LIVE_BEWEZEN`, `ROLLED_BACK_GREEN` or evidenced `BLOCKED_HARD_BOUNDARY`) may end the lineage. Never create a new recovery PR merely because post-merge readback is still running.

## Mandatory material-run closure gate

Fingerprint: `powerhouse|material-run|closure-artifacts|required|v1`.

For every material repository-backed chat/agent execution, durable closure is part of the execution itself. Required CI must fail closed unless the same candidate contains: canonical Brain learning, an append-only activity/development ledger event, and human-readable change/learning documentation. Policy text, a chat statement, or a local skill result is not evidence that closure happened.

The runtime sequence is mandatory: material action → Brain learning → activity ledger → human documentation → deterministic skill projection → protected delivery → production/provider readback → next-agent discoverability. A missing closure artifact is `WRITEBACK_INCOMPLETE`, never terminal success.

## Exact-head terminal recovery observability

Fingerprint: `github|chat-terminal-recovery|exact-head-observability|v1`.

When continuity/recovery touches GitHub delivery:
- under `pipefail`, avoid producer pipelines whose bounded consumer intentionally `break`s; use process substitution or an equivalent that cannot convert expected early-consumer completion into SIGPIPE failure;
- classify jobless failed workflow runs as YAML/workflow-parse incidents before product-code diagnosis;
- `github_main` terminal proof requires `production_observed_sha === main_sha`;
- preserve HTTP status and a sanitized response body for terminal writeback failures before fail-closed exit;
- keep the same chat/agent lineage alive through exact-head BRAIN + CodeQL + Required, protected merge, production readback, canonical learning/prevention writeback, skill projection readback and writer-lease release.

Canonical source: `brain/learning/2026-09-19-chat-github-terminal-recovery-prevention-v1.json`.
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


## Runner-aware simultaneous development

Fingerprint: `github|ci-admission|single-flight-runner-budget-v1`.

Every chat and agent treats GitHub runner capacity as a shared governed resource. Independent obligations may build simultaneously, but identical obligation/head work is deduplicated before dispatch. Native PR events and recovery dispatches for Required/BRAIN are one logical single-flight lane. Recovery reuses the current lineage; it never amplifies runners or starts repository-wide scans from feature-branch pushes.


## Channel semantic isolation before scoring

Fingerprint: `content|channel-semantic-isolation|personal-company|v1`.

Channel identity is a hard eligibility invariant before recommendation scoring or creative generation. A personal-source recommendation may never become eligible for `linkedin_company`; the company lane rejects personal targets/personal-truth evidence and must materialize its measurable canonical campaign link before generation. `linkedin_personal` final copy must itself preserve a concrete first-person event and verified source anchors; metadata-only personal truth is insufficient. If either invariant fails, remain fail-closed and regenerate/recover within the same canonical lineage. Production proof for this control is recorded in `brain/evidence/2026-09-20-content-channel-semantic-isolation-v1-production.json`.


## Terminal autonomous reconciliation

Fingerprint: `terminal-autonomous-reconciler-v1`.

Every chat, agent and runtime worker treats terminal control-plane health as a fail-closed invariant, not as a dashboard convenience.

- `GREEN_STALE` is never terminal green; re-run the existing canonical production-truth reconciler.
- An `ESCALATED` reconciliation job blocks overall control-plane health until it is resolved or has an evidenced hard boundary.
- A stale `PLANNED` operation blocks health. Automatically requeue only internal work that is explicitly side-effect-free with `execution_resilience.side_effect_state=NOT_STARTED`; unknown/external side effects remain fail-closed.
- Never auto-fulfil an obligation merely to obtain zero-open counts. Fulfilment requires actual outcome/readback evidence.
- Production-project health and Supabase preview/branch migration health are separate signals; a preview `MIGRATIONS_FAILED` state must create/reconcile drift but must never cause destructive production rollback by inference.
- A proven optimization at its configured safe lower bound is terminal/idempotent. Do not manufacture an impossible smaller challenger; `PROVEN_OPTIMIZATION_FLOOR_IS_TERMINAL_NO_OP`.
- Material contradictions between evidence fields (for example blocker active while promotion + production readback are proven) are themselves defects and must remain visible until reconciled.
- Reuse `public.powerhouse_terminal_control_plane_health_v1` and `public.powerhouse_terminal_autonomous_reconcile_v1`; do not create a second health truth or recovery scheduler.

Canonical source: `brain/learning/2026-09-20-terminal-autonomous-reconciler-v1.json`.
