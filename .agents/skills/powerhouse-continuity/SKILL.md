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
