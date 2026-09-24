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


### Terminal health lifecycle v2

- Current runtime health and historical proof are separate. Only an explicitly versioned desired state with `desired_state.lifecycle=RETIRED` is excluded from current truth health.
- Retirement preserves the historical `brain_production_truth`; never create a fresh observation just to turn a retired proof green.
- Current `BLOCKED` obligations and active `GREEN_STALE`, `DRIFTED`, or `UNKNOWN` production truth keep `control_plane_healthy=false`.
- An ESCALATED reconciliation can auto-resolve when its underlying operation is already terminal (`VERIFIED` or `COMPENSATED`).
- A historical `selftest-*` may be compensated only when it is still `PLANNED`, older than 24h, `dispatch_generation=0`, and has no `remote_ref`; compensation means “did not execute”, never “succeeded”.
- Use the same canonical reconciler and health view. Do not create a parallel lifecycle monitor.


### PostgreSQL view upgrade compatibility

Fingerprint: `postgres-view-replace-upgrade-column-order-v1`.

- Fresh-schema preview success is not sufficient proof for `CREATE OR REPLACE VIEW` changes.
- Preserve every existing output column name and order as an immutable prefix. Append new columns only at the end.
- Never rely on PostgreSQL to reinterpret a shifted output column as a rename; production will reject this with `42P16`.
- A drop/recreate view migration requires explicit dependency analysis and is not the default repair.
- Release verification for view evolution must include an upgrade-path replay against the previous canonical view shape.


## Live System Map registration

Fingerprint: `powerhouse-canonical-system-map-agent-update-contract-v1`.

Every current and future material chat, agent, workflow, skill or autonomous capability must remain discoverable in the one canonical System Map. The human authority is Notion page `3dcda36a-ac8a-8152-be3d-edbb32b06239`; the machine manifest is `platform/system-map/canonical-system-map.mjs`; the operator surface is the `Systeemkaart` tab in Powerhouse Control Center.

Mandatory:
- read the existing System Map before structural work;
- reuse an existing component/agent before creating a new one;
- on create/rename/retire/rewire, update identity, owner, domain, inputs, outputs and relations in the same lineage;
- emit runtime evidence with actor identity so active chats/agents/workflows appear automatically;
- keep repository inventories for skills, agent-fabric modules, Netlify functions, Supabase Edge Functions and GitHub workflows synchronized;
- require System Map read-after-write before a structural change may be `LIVE_BEWEZEN`.

A material component that exists in execution but not in the canonical System Map is `SYSTEM_MAP_WRITEBACK_INCOMPLETE`, not done.


## Interaction proof and public i18n prevention

Fingerprint: `pricing-toggle-i18n-runtime-20260924-v1`.

For user-visible toggles, tabs, billing switches and language controls:
- marker-presence is never functional proof; require state-change proof by executing the actual click/change and asserting the resulting user-visible state;
- candidate route health and generic browser smoke tests do not replace interaction-specific evidence;
- public website language switching uses static localized routes as the primary path, not runtime translation-provider availability;
- localized routes must have explicit routing coverage and be verified in the production browser;
- an English production proof must confirm `html lang=en`, visible English copy, absence of the known Dutch source heading, and absence of the runtime translation failure message;
- runtime/cache version changes must update exact-version regressions in the same lineage;
- never claim `LIVE_BEWEZEN` for an interaction incident until the exact interaction has passed browser-level production proof.

Canonical verifier: `tools/site-shell/verify-pricing-i18n-production.mjs`.
Canonical retrospective: `docs/changes/pricing-i18n-incident-retrospective-20260924-v1.md`.


## Netlify deploy-auth terminal boundary

Fingerprint: `netlify-deploy-auth-hard-boundary-20260924-v2`.

For Bedrijfsgeheugen production delivery:
- a Netlify MCP `401 Unauthorized` is transport/authentication failure, never evidence that pricing, i18n or application code is wrong;
- after one authoritative 401 readback, do not repeatedly mutate app code or blindly rerun the same stale credential;
- first obtain a fresh Netlify deploy authorization through the connected Netlify account;
- if the canonical environment cannot safely persist that fresh authorization into GitHub Actions and the direct artifact runner cannot reach the provider, classify the state as `BLOCKED_HARD_BOUNDARY`;
- the only valid next authority in that state is account-level reauthorization/credential rotation; never embed proxy credentials in repository files, PR text, workflow inputs, logs, documentation or chat output;
- preserve the exact current-main production artifact and SHA so deployment resumes without rebuilding unrelated code;
- after credential recovery, rerun the canonical Production Source Snapshot and require exact `release.json` SHA plus browser-level pricing/i18n proof before `LIVE_BEWEZEN`;
- write the incident, failed transport routes, evidence IDs and prevention into Brain learning, ledger, documentation and skill projection in the same delivery lineage.

A fresh credential existing only transiently in a connector is not equivalent to durable deployment authority.


## Static i18n provider build fallback

Fingerprint: `static-i18n-provider-fallback-regression-20260924-v2`.

- Build-time external translation is enrichment, not website publication authority, while the canonical runtime i18n fallback exists.
- A deterministic provider 4xx must fail fast; do not waste retries that cannot change the outcome.
- Provider error diagnostics may include only bounded sanitized response text/status, never credentials.
- Always emit locale routes; mark untranslated static English with `data-bg-static-translated="false"` so runtime translation can take over.
- Never claim English fixed merely because Netlify published. Require production browser proof on the actual language switch and `/en/prijzen`.


## Production pricing/i18n interaction gate

Fingerprint: `production-readback-pricing-i18n-browser-gate-20260924-v1`.

- Generic 200/route smoke is insufficient for pricing or language-switch incidents.
- Canonical Production Release Readback must execute `tools/site-shell/verify-pricing-i18n-production.mjs` after exact deploy identity is observed.
- Required visible behavior: lifecycle-stage click, plan-group click, monthly/yearly switch, NL→EN navigation, `/en/prijzen`, `html lang=en`, visible English pricing text and no known Dutch pricing H1.
- Workflow changes to the readback itself must force one pricing-browser proof on introduction.
- Only exact SHA + successful interaction proof may close the incident as `LIVE_BEWEZEN`.


## Pricing dual-controller visible-state parity

Fingerprint: `pricing-inline-rescue-visible-state-parity-20260924-v1`.

When multiple pricing interaction controllers can touch the same lifecycle or plan-group state, they must apply one identical visible-state tuple: `hidden`, inline `style.display`, `aria-hidden`, active class, `aria-selected` and keyboard `tabIndex`. Never let one controller clear only `hidden` while another has left inline `display:none`.

Production proof must wait for the canonical pricing runtime readiness marker and then execute the actual click. Route 200, marker presence or DOM mutation alone are not completion.


## Pricing runtime build preservation

Fingerprint: `pricing-runtime-build-preservation-20260924-v1`.

A pricing runtime present in repository source is not proof that production contains it. Full-page/V18 build transforms may replace markup outside the canonically restored pricing section.

Mandatory:
- pricing build integrity restores `#pakketten` plus the canonical inline pricing controller and versioned rescue runtime;
- post-transform restore must fail closed if either runtime is absent;
- production verification waits for the rescue readiness marker and then executes actual pricing clicks;
- never diagnose a missing readiness marker as a click-handler bug before checking the built-page preservation contract.


## Pricing lifecycle browser-visible state

Fingerprint: `pricing-lifecycle-visible-state-20260924-v1`.

- A selected pricing stage is not proven by aria state alone; its panel must be browser-visible.
- Active lifecycle panels explicitly remove `hidden` and force visible display through the rescue state layer.
- Inactive panels explicitly remain hidden.
- Production readback is the terminal oracle: the actual lifecycle click must make the matching panel visible before release closure.


## GitHub OIDC Netlify deploy transport

Fingerprint: `netlify-github-oidc-deploy-bridge-20260924-v1`.

- Do not depend on a long-lived GitHub secret for expiring Netlify MCP proxy credentials.
- Production Source Snapshot acquires deploy transport just-in-time with GitHub Actions OIDC.
- The bridge must validate exact issuer, audience, repository, `refs/heads/main`, and exact workflow reference before releasing transport.
- Store deploy transport encrypted in a backend secret store; the current canonical bridge uses Supabase Vault plus a service-role-only RPC.
- Mask the returned transport before writing it to `GITHUB_ENV`; never print it, commit it, attach it as an artifact, or expose it to the user.
- Exact Netlify SHA plus pricing/i18n production browser proof remain mandatory for `LIVE_BEWEZEN`.


## Netlify provider build fail-fast diagnostics

Fingerprint: `netlify-provider-build-failfast-diagnostics-20260924-v1`.

- Successful deploy submission is not proof that the provider build is healthy.
- Capture `deployId` and `buildId` from the authorized Netlify transport output.
- Poll provider deploy state before waiting for public `release.json`.
- When provider state is `error`, emit only sanitized allowlisted build/deploy metadata and fail immediately.
- Never log the OIDC deploy proxy or any secret values.
- Provider `ready` is still not terminal closure: exact SHA and pricing/i18n browser proof remain required.


## Netlify terminal deploy completion

Fingerprint: `netlify-terminal-deploy-wait-v1`.

- A production transport command being accepted or started is not deployment success.
- Canonical Production Source Snapshot must wait for the Netlify provider-side deploy to reach terminal completion; do not use `--no-wait` in this production path.
- Only after provider-terminal completion may exact `release.json` SHA/context/deploy-id proof and production browser interaction proof run.
- If the deploy fails, surface the provider-terminal failure in the deploy step rather than masking it as a later generic SHA timeout.
- `LIVE_BEWEZEN` still requires exact production SHA plus the relevant user-visible browser gates.

## Netlify OIDC linked-build fallback

Fingerprint: `netlify-oidc-linked-build-fallback-20260924-v1`.

- Production delivery order is: bounded Git-linked wait → OIDC linked-repository build for `main` → bounded exact-SHA wait → MCP deploy fallback.
- Netlify credentials remain server-side in the OIDC bridge; workflow logs may expose only non-secret build/deploy identifiers.
- A green transport command is never equivalent to production success.
- Closure still requires exact `release.json` SHA/context plus pricing/i18n browser proof.


## Netlify Vault proxy expiry hard boundary

Fingerprint: `netlify-vault-proxy-expiry-hard-boundary-20260924-v1`.

When the canonical production flow shows both:
- linked-build trigger `ok=false`; and
- Netlify MCP fallback `401 Unauthorized`;

treat this as deploy-authentication failure caused by stale/expired provider authority, not as application, pricing, SEO or i18n failure.

Mandatory behavior:
- do not mutate website or application code unless separate evidence proves a code defect;
- do not blindly rerun the same stale credential;
- credential recovery must happen through an authorized secret-store-native rotation path;
- never copy transient provider credentials into repository files, PR bodies, workflow inputs, logs, docs or chat;
- preserve the exact current-main artifact/SHA while delivery authority is unavailable;
- after credential recovery, rerun canonical Production Source Snapshot and require provider success + exact `release.json` SHA/context/deploy-id + production browser proof before `LIVE_BEWEZEN`.

Canonical evidence: production snapshot run `36010221414`, readback run `36010220920`.
Canonical regression: `tests/brain-netlify-vault-proxy-expiry-hard-boundary-v1.test.mjs`.


## Netlify build-script syntax gate

Fingerprint: `pricing-build-integrity-regex-syntax-20260924-v1`.

For every Node script referenced by the canonical `netlify.toml` build command:
- run `node --check` before merge;
- treat provider build exit code 2 as a parse/build-contract failure until reproduced;
- reproduce the exact Netlify build command before changing application behavior;
- use template literals or otherwise safe quoting for regex strings containing both single and double quote characters;
- retain exact production SHA + provider + browser proof before `LIVE_BEWEZEN`.

Canonical regression: `tests/brain-pricing-build-integrity-node-syntax-v1.test.mjs`.

## Pricing interaction section build preservation

Fingerprint: `pricing-interaction-section-build-preservation-20260924-v1`.

For the pricing production build:
- treat `section#prijzen-pakketten` and `section#pakketten` as one atomic preservation boundary;
- V18/full-page transforms may not be trusted to preserve pricing interaction attributes outside `#pakketten`;
- after transforms, restore both canonical sections from the captured pre-build source;
- fail the build if lifecycle selectors, lifecycle panels, plan-group tabs or monthly/yearly billing selectors are missing;
- source presence is not terminal proof: the production browser must click the actual lifecycle, plan and billing controls and prove visible-state changes;
- keep static localized public routes as the canonical public i18n path and verify the English pricing route in the same browser gate.

Canonical learning: `brain/learning/pricing-interaction-section-build-preservation-20260924-v1.json`.
Canonical regression: `tests/brain-pricing-runtime-build-preservation-v1.test.mjs`.
Canonical browser verifier: `tools/site-shell/verify-pricing-i18n-production.mjs`.
