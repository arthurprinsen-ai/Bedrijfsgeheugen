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


## Pricing mobile primary-control visibility gate

Fingerprint: `pricing-mobile-lifecycle-tabs-visible-20260924-v1`.

For pricing lifecycle controls on mobile:
- every primary lifecycle option must be directly visible without horizontal scrolling;
- use wrapped labels and at least 48px touch height;
- production browser proof must use normal clicks at 390px width; never force-click around an offscreen/hidden control;
- if a selector exists in DOM but Playwright cannot visibly click it, treat this as a UI contract failure, not a test flake.

Canonical regression: `tests/brain-pricing-mobile-lifecycle-tabs-visible-v1.test.mjs`.

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


## Derived metric compatibility

Fingerprint: `company-ledger-verified-value-semantics-20260924-v1`.

When introducing a stricter evidence-backed metric on top of an existing Powerhouse aggregate:
- do not silently tighten or redefine the established aggregate contract;
- keep legacy economics compatible unless a separately versioned migration explicitly changes it;
- model the stricter metric with its own eligibility set and field/read-model;
- prove both old aggregate semantics and new strict semantics in one regression fixture;
- treat a main-baseline regression discovered by an unrelated delivery lane as inherited baseline evidence, then repair the baseline separately before re-proving the blocked candidate.

For Verified Value Created specifically, `verifiedValueByProblem` requires executed + verified + evidence, while `economics.realizedValue` retains verified-value ledger compatibility.


## GitHub Actions queue-storm prevention

Fingerprint: `actions-queue-storm-guard-20260924-v1`.

For Powerhouse delivery recovery:
- repository-wide recovery must never run on every push to `main`;
- recovery scanning is scheduled/manual only, currently every 15 minutes;
- open the repository circuit breaker when active/queued/pending/waiting/requested Actions work reaches 20;
- recover at most one PR per supervisor cycle;
- suppress duplicate Required/BRAIN dispatch while equivalent work is already active;
- enforce one canonical open PR per `Obligation-ID`; close superseded duplicates before retriggering admission;
- never mutate the active candidate while exact-head checks are running unless a concrete failing gate requires a corrective commit;
- classify recovery-supervisor workflow changes and their regression tests as website control-plane changes so CI-only recovery fixes do not launch public-site browser crawls;
- keep the prevention in Brain learning, regression tests, development ledger and this skill together;
- only claim terminal completion after exact-head Required, BRAIN, CodeQL and Skill Projection succeed, protected merge completes, and `main` readback confirms the guard.

Canonical implementation: `.github/workflows/powerhouse-delivery-recovery-supervisor.yml`.
Canonical learning: `brain/learning/actions-queue-storm-guard-20260924-v1.json`.
Canonical regressions: `tests/brain-actions-queue-storm-guard-v1.test.mjs` and `tests/delivery-powerhouse-supervisor.test.mjs`.


## Predict-before-dispatch queue governor

Fingerprint: `github|actions-queue-pressure-governor|predict-before-dispatch|v1`.

Every material chat/agent reads current Actions pressure and forecasts run fan-out before a repository mutation, retry, dispatch or recovery. Soft pressure starts at 12 active or 10 queued; hard circuit opens at 20 active or 20 queued; one action may not intentionally create more than 6 new runs. Under pressure: reuse exact-head work, keep one canonical obligation/PR, batch related writes, suppress optional CI and take only backlog-reducing recovery actions. Healthy current-head work is never cancelled for age alone.

## Obsolete Actions-run identity

Fingerprint: `github|actions-obsolete-run-identity|sha-bound|v1`.

Queue/run authority is bound to the exact run SHA, not merely to a branch name. A stale queued or in-progress run may be reaped only when its identity is provably obsolete: closed PR, PR-head mismatch, branch-head mismatch, missing non-main branch, or old main SHA. In-progress cleanup additionally requires at least 1800 seconds without update.

Unexpected candidate-head movement is fail-closed. Before a new head inherits authority, compare it to the last trusted head and verify that the diff is exactly the intended recovery delta. Never silently follow a moved branch.


## Noindex utility SEO scope

Fingerprint: `seo-login-noindex-public-scope-20260924-v1`.

- Authentication/login utility routes that are explicitly `noindex` stay outside public SEO and sitemap inventory.
- Model them explicitly as valid internal utility destinations rather than forcing them into indexable SEO scope.
- Technical SEO may exempt only explicitly classified utility destinations; unknown non-indexable internal targets remain failures.
- Fix the shared route classifier and its consumers, never index a utility route just to silence a sitemap/link gate.

Canonical learning: `brain/learning/seo-login-noindex-public-scope-20260924-v1.json`.
Canonical regression: `tests/brain-seo-login-noindex-scope-v1.test.mjs`.

## Delivery control-plane scale & supersession

Fingerprint: `delivery-control-plane-open-pr-scale-supersession-v1`.

For every GitHub-backed Powerhouse delivery:
- candidate discovery over open PRs must be complete, paginated and bounded; never assume one `per_page=100` response is the full candidate set;
- synchronous GitHub CLI/API reads that can grow with repository state must set an explicit safe output buffer and must fail with concise evidence rather than dumping an unbounded payload;
- an explicit same-obligation successor may move the predecessor to `SUPERSEDED`, but `SUPERSEDED` and `CLOSED` are non-terminal delivery states;
- never map predecessor closure, successor creation, queued checks, auto-merge or merge alone to `LIVE_BEWEZEN`;
- terminal truth remains exact lineage → protected merge → production/provider readback → learning/skill projection → terminal evidence;
- successor recovery must preserve the predecessor's required content, tests, governance and documentation and must declare `Supersedes: <PR>` on the same `Obligation-ID`;
- when repository scale grows, admission correctness has priority over cheap single-page shortcuts: missing an open conflicting/same-obligation candidate is a control-plane integrity defect.

Canonical regression: `tests/brain-delivery-control-plane-scale-supersession-v1.test.mjs`.
Canonical learning: `brain/learning/2026-09-24-delivery-control-plane-open-pr-scale-supersession-v1.json`.


### Stale GitHub queue autorecovery

Fingerprint: `delivery|stale-queued-no-open-pr|autoreap|v1`.

Repository queue health is part of terminal delivery correctness. Old queued runs may not accumulate indefinitely behind current work.

Mandatory:
- the canonical repository janitor runs hourly and paginates the full open-PR set;
- never treat repository queue length as code failure without separating current-head jobs from stale/no-owner jobs;
- preserve `main`, every current head of an open PR, and all `in_progress` work from TTL-based cleanup;
- a non-main `queued` run with no open PR may be cancelled automatically after 6 hours because it has no current delivery authority; a future reopen/successor must emit fresh exact-head checks;
- stale-run cleanup must be read back and logged; cancellation is queue hygiene, not obligation completion;
- queue autorecovery must never weaken Required/BRAIN/CodeQL/production-readback gates for the current canonical successor.

Regression: `tests/brain-delivery-stale-queue-janitor-v1.test.mjs`.
Learning: `brain/learning/2026-09-24-delivery-control-plane-open-pr-scale-supersession-v1.json`.


### Prevention-fix integrity

Fingerprint: `delivery|prevention-fix|workflow-integrity|v1`.

A fix to the delivery/control-plane is itself production-critical code and must be protected against self-corruption.

Mandatory:
- rebuild complex workflow recovery from a known-clean canonical source when structural text has become suspect;
- prefer JSON-per-record transport between GitHub CLI and shell over delimiter-based parsing;
- do not trust a prevention patch merely because the intended logic is present; also assert structural uniqueness and syntax-safe composition;
- every self-healing or janitor change requires a regression that checks the integrity of the workflow that performs the healing;
- when a fix introduces a second defect, record both the original root cause and the fix-induced defect in the same canonical learning lineage, including failed approach and prevention.

Regression: `tests/brain-delivery-janitor-workflow-integrity-v1.test.mjs`.
Learning: `brain/learning/2026-09-24-delivery-control-plane-open-pr-scale-supersession-v1.json`.
## Feature-live versus exact-main proof

Fingerprint: `powerhouse|production-descendant-proof|v1`.

- A feature may be LIVE_PROVEN when the provider production commit is a verified descendant of the feature merge and the deployed source readback contains the feature.
- “Current main is live” is stricter: provider `commit_ref` must equal the current protected `main` SHA.
- Never reject a valid feature-live proof only because production has advanced beyond the feature merge; verify ancestry instead.
- Never claim exact-main parity from ancestry alone.
- Provider state must be `ready` and context must be `production`; preview state is not production proof.

## Material writeback and learning closure

Fingerprint: `powerhouse|material-writeback-complete-lineage|v1`.

Every material candidate must carry in the same lineage:
- Brain learning;
- activity/development ledger event;
- human-readable documentation;
- reusable prevention semantics;
- regression/historical replay evidence when learning canonicalization requires it.

## Canonical stale-production recovery

Fingerprint: `powerhouse|stale-production-canonical-snapshot|v1`.

When protected main has the intended feature but Netlify production is stale, reuse the canonical Production Source Snapshot; never create a second deploy authority.

## Canonical PR continuity during zero-diff reconciliation

Fingerprint: `github|same-pr|zero-diff-autoclose-recovery|v1`.

Preserve the obligation delta before moving a branch ref; after replay verify branch head and PR state, reopen the same canonical PR when GitHub auto-closes a transient zero-diff state, and re-prove exact-head gates.

## Netlify linked skip continuity

Fingerprint: `netlify|linked-skip|same-authority-fallback|v1`.

If the canonical Git-linked production trigger is skipped by Netlify:
- keep the same obligation and deployment authority;
- treat `Skipped` as an incomplete transport outcome, never as LIVE;
- continue through the existing authorized exact-source fallback when available;
- retain exact source identity and provider readback requirements;
- never fork to an ad-hoc manual deploy path merely because the linked build was skipped.



## Pricing terminal recovery integrated closure

Fingerprint: `pricing-terminal-recovery-postmortem-20260924-v1`.

For pricing/i18n recovery, treat terminal delivery as one composed contract:
- preserve `section#prijzen-pakketten` and `section#pakketten` atomically;
- public locale authority is the static route prefix, never stale persisted public state;
- noindex authentication pages are explicit utility destinations, not indexable SEO routes;
- queued/pending CI is not evidence of a code defect and must not trigger proof-only candidate mutation;
- material recovery must include Brain learning, append-only ledger and human-readable documentation in the same lineage;
- terminal success requires protected merge + provider production identity + user-visible browser behavior;
- use ancestry for feature-live when production advanced beyond the feature merge; reserve SHA equality for exact-current-main claims;
- keep one canonical deploy authority and one canonical obligation lineage.

Canonical postmortem: `brain/learning/pricing-terminal-recovery-postmortem-20260924-v1.json`.
Canonical documentation: `docs/changes/pricing-terminal-recovery-postmortem-20260924-v1.md`.

## Mobile primary-control actionability

Fingerprint: `pricing-mobile-lifecycle-offscreen-click-v1`.

For mobile public surfaces, a primary decision control must be directly actionable without depending on hidden horizontal overflow. DOM presence, ready markers and synthetic events are not functional proof. Preserve real browser click/tap verification on the actual mobile viewport. If a primary tab strip pushes later choices offscreen, prefer a visible wrap/grid arrangement unless deliberate horizontal navigation has its own explicit discoverability and interaction proof.

Regression: `tests/brain-pricing-mobile-lifecycle-actionability-v1.test.mjs`.


## Re-runnable exact-main production proof

Fingerprint: `production-readback-manual-exact-main-v1`.

- Production proof must be re-runnable without mutating product code or creating dummy commits.
- `Production Release Readback` exposes `workflow_dispatch` and manual dispatch always requires exact deployment identity plus browser verification.
- Manual exact-main proof always includes `/prijzen`, including the pricing lifecycle and static-English interaction contract.
- A superseded/cancelled readback is non-terminal even when the job shell ends green; skipped functional proof is not proof.
- Concurrency may cancel stale readbacks, but the newest canonical main can always be explicitly re-proven.
- Never manufacture terminal status from a non-deployment readback when the functional browser gate was skipped.

Regression: `tests/brain-production-readback-manual-exact-main-v1.test.mjs`.
Learning: `brain/learning/production-readback-manual-exact-main-20260924-v1.json`.


## Terminal browser-proof refresh

Fingerprint: `pricing-i18n-terminal-readback-refresh-v1`.

If production runtime is already merged but the canonical functional proof was cancelled, skipped or raced a provider deployment:
- do not weaken the verifier and do not use force-clicks or DOM-click bypasses;
- prefer manual exact-main readback when dispatch is available;
- when the active connector cannot dispatch workflows, a versioned operational refresh of the canonical readback workflow is permitted only as a documented recovery candidate with no product behavior change;
- the recovery must carry Brain learning, human docs, ledger evidence and protected CI;
- terminal proof still requires exact production SHA/provider deploy identity and the real production browser interaction.

Learning: `brain/learning/pricing-i18n-terminal-readback-refresh-20260924-v1.json`.


## Production route body-readiness retry

Fingerprint: `production-route-body-readiness-retry-v1`.

When exact production SHA is already proven but the generic browser route verifier hits a transient Playwright `TimeoutError` during navigation/body readiness:
- retry the complete route observation on a fresh page;
- maximum three attempts with bounded backoff;
- retry only `TimeoutError`;
- all other errors fail immediately;
- exhaustion remains terminal;
- never skip the route gate or pricing/i18n proof because deployment identity is already green.

Regression: `tests/brain-production-route-body-readiness-retry-v1.test.mjs`.
Learning: `brain/learning/production-route-body-readiness-retry-20260924-v1.json`.


## Production browser stable-scroll before click

Fingerprint: `pricing-production-stable-scroll-before-click-v1`.

When a production browser proof sees a real control but Playwright `scrollIntoViewIfNeeded()` times out waiting for stability:
- distinguish auto-scroll/actionability instability from product-runtime failure;
- use deterministic DOM `scrollIntoView({block:'center'})` only for positioning;
- keep the actual interaction as a real Playwright locator click;
- assert a non-zero actionable box before clicking;
- never use `force:true` or DOM `.click()` to manufacture a green proof;
- preserve exact production SHA/provider identity and rerun the same functional proof after the verifier fix.

Regression: `tests/brain-pricing-mobile-lifecycle-actionability-v1.test.mjs`.
Learning: `brain/learning/pricing-production-stable-scroll-20260924-v1.json`.


## Product-specific production readiness

Fingerprint: `pricing-production-runtime-readiness-v1`.

When a production browser proof has an explicit product/runtime-ready marker, that marker outranks generic page/body visibility as readiness authority.

Mandatory:
- wait first on the domain-specific runtime-ready contract;
- then require the concrete target control to become visible/actionable;
- do not fail a production proof solely because a generic `body` visibility wait times out while the product-specific runtime and content are present;
- preserve real user interaction proof after readiness: no `force:true`, no DOM `.click()`;
- keep exact production SHA/provider identity separate from interaction readiness and require both for terminal proof.

Regression: `tests/brain-pricing-mobile-lifecycle-actionability-v1.test.mjs`.
Learning: `brain/learning/pricing-production-runtime-readiness-20260924-v1.json`.


## Production route visible-surface proof

Fingerprint: `production-route-visible-surface-v1`.

For generic production route verification:
- do not use the `body` element's own Playwright `visible` state as the sole rendering sentinel;
- require body attachment, non-empty rendered text and at least one genuinely visible top-level content surface;
- continue to verify HTTP status, canonical identity, title, assets and page errors;
- keep functional browser verifiers separate and mandatory for critical interactions;
- never weaken a pricing/i18n click gate merely to compensate for a generic route sentinel false negative.

Regression: `tests/brain-production-route-visible-surface-v1.test.mjs`.
Learning: `brain/learning/production-route-visible-surface-20260924-v1.json`.


## Full-site browser sweep without queue amplification

Fingerprint: `standalone-visibility-bounded-concurrency-v1`.

When a required website gate verifies every public route across multiple viewports:
- preserve full route and viewport coverage;
- do not run hundreds of browser navigations serially when bounded concurrency can keep the same assertions;
- cap worker concurrency explicitly;
- retain a global fail-closed time budget;
- treat many PRs stuck on the same long browser step as shared CI queue amplification, not independent product defects.

Regression: `tests/brain-standalone-visibility-bounded-concurrency-v1.test.mjs`.


## Default terminal user answer + Dashboard writeback

Fingerprint: `delivery|terminal-user-handoff|dashboard-writeback|v1`.

A material Powerhouse delivery may not end with a user-facing list of remaining autonomous steps. Pending CI, auto-merge, deploy, readback, documentation, skill projection or dashboard registration are internal execution states.

Before the terminal answer:
- continue the same canonical lineage through protected merge/promotion and production/provider readback;
- write root cause, fix, regression, prevention and outcome to canonical Brain learning and ledger/docs;
- update/reconcile the relevant Powerhouse skill projection;
- register the terminal state and evidence in the existing Powerhouse current-state/dashboard and agent activity surfaces;
- read back those writebacks where the connector/runtime supports it.

The normal terminal user answer reports the terminal state and proof already completed. It does not return a "what now" list for work the node can perform itself.

Only an evidenced `BLOCKED_HARD_BOUNDARY` may return ownership to the user; it must name the exact external boundary, the smallest required human action, and the next safe action already prepared.


## Evidence-first closed-loop delivery

Fingerprint: `powerhouse-closed-loop-evidence-first-v1`.

For sales, content, social, growth, portal intelligence and autonomous improvement, Powerhouse uses one evidence-first lifecycle:

`signal → analysis → prediction → decision → execution → provider_readback → outcome → realized_value → calibration → next_decision`.

Mandatory truth gates:
- merge, deploy, dispatch, publication and provider acceptance are intermediate states, not terminal outcomes;
- every material stage carries an evidence reference;
- predicted/expected value is never stored as realized value;
- realized value requires observed external or business evidence;
- missing evidence remains open, blocked, outcome_pending or calibration_pending;
- replays are idempotent and stage progression remains contiguous;
- learning may change future policy only after outcome/calibration evidence exists;
- machine truth remains in Supabase; GitHub is the reproducible contract; Portal/Notion are human projections, not alternate truth authorities;
- LinkedIn direct publication/readback remains Composio-authoritative; Buffer cannot satisfy direct-publication truth gates;
- Instagram provider evidence must come from the governed direct provider path and Mira-only media rules remain mandatory.

Runtime health authority: `powerhouse_closed_loop_health_v1`.


## Historical Required failure — safe descendant terminal recovery

Fingerprint: `github|terminal-required-descendant-recovery|website-baseline|v1`.

A merged website obligation may not remain permanently nonterminal only because its historical `Required` run failed on a baseline assertion that has since been repaired in canonical `main`.

Recovery is permitted only when all of these are true:
- the original PR is merged and its merge SHA is an ancestor of current `main`;
- the original exact-head BRAIN gate remains green;
- applicable exact-head CodeQL remains green;
- the current-main website baseline suite passes, including the bounded full-route visibility regression;
- production/provider readback still proves the merged change is contained in live production;
- the terminal evidence records this as descendant regression recovery, never as retroactive exact-head success.

This rule exists to close stale verifier debt without weakening product gates or spawning duplicate recovery PRs.


## Production i18n fail-closed invariant

Fingerprint: `i18n-production-fail-closed-20260924-v1`.

For public localized production builds:
- resilience/backoff may retry provider failures but may never convert a production translation failure into `null` and continue;
- with `STATIC_I18N_NETWORK=1`, missing/incomplete translations are a build failure;
- an `/en/*` route is not production proof unless visible content is English;
- the known Dutch pricing H1 and `Switching language failed. Try again.` are hard negative oracles for the English pricing route;
- every i18n release must rerun the production browser verifier before `LIVE_BEWEZEN`.


## Public i18n canonical route symmetry

Fingerprint: `public-i18n-dutch-canonical-roundtrip-20260925-v1`.

For public website localization:
- Dutch is the canonical unprefixed route authority: `/`, `/prijzen`, `/over-ons`, etc.;
- English is the prefixed authority under `/en/*`;
- never generate or navigate to `/nl/*` as a canonical public destination;
- language switching must preserve the current logical path, query and hash in both directions;
- static build canonical, hreflang, og:url and internal-link rewriting must use the same locale mapper as the runtime switcher;
- legacy `/nl` URLs must 301 to the matching unprefixed Dutch route;
- terminal production proof for material i18n changes must exercise a real NL → EN → NL browser roundtrip and reject any Dutch `/nl/*` result.

Regression: `tests/brain-public-i18n-static-route-authority-v1.test.mjs`.
Canary: `tools/site-shell/verify-pricing-i18n-production.mjs`.
Learning: `brain/learning/public-i18n-dutch-canonical-roundtrip-20260925-v1.json`.


## Pricing rescue mutation-observer safety

Fingerprint: `pricing-rescue-observer-self-loop-20260925-v1`.

- A pricing recovery observer may not react to the runtime's own textContent updates.
- Whole-body `childList` observation must be filtered to newly added relevant pricing controls/panels before scheduling `syncFromDom()`.
- `ready-v3` must be observable by a real browser before pricing is considered interactive.
- Terminal production proof remains lifecycle click + plan tab + billing switch + NL/EN round trip.


## Deterministic production i18n cache

Fingerprint: `website|i18n|versioned-static-cache|v1`.

Production English localization must not require a live translation-provider call when the public source corpus is unchanged. The complete English translation map is a versioned repository artifact at `data/i18n/bg-static-i18n-en.json`.

Before delivery, run `node tools/site-shell/build-localized-routes.mjs --validate-cache`. It must prove every currently selected public source string has a non-empty cached English translation.

If source copy introduces new strings, update the cache in the same candidate lineage. Production remains fail-closed: never publish untranslated `/en/*` pages and never convert provider/cache failure into silent fallback.


## Production build-oracle semantic parity

Fingerprint: `pricing-build-oracle-context-parity-20260925-v1`.

- Production build oracles are executable product contracts, not passive documentation.
- When website/Portal business-context semantics change, update source, reusable components, entitlement regressions and pre-build integrity tokens atomically.
- Never restore retired copy or semantics merely to satisfy a stale test/oracle.
- After a Netlify build failure, reproduce the exact packaged production source before changing runtime behavior.
- For NL/EN delivery, the build chain must pass completely before exact-source deployment and the NL → EN → NL browser canary can establish LIVE_BEWEZEN.

Regression: `tests/brain-pricing-build-integrity-context-parity-v1.test.mjs`.
Learning: `brain/learning/pricing-build-oracle-context-parity-20260925-v1.json`.
- Any public-copy/SEO change that introduces translatable strings must update canonical `data/i18n` English cache coverage in the same candidate and pass offline `--validate-cache`; provider fill is recovery, never the normal unchanged-deploy path.
