# Autonomous Publication Controller Design

## Purpose

Powerhouse must guarantee that every approved, due publication is either demonstrably published, actively under a bounded safe repair, or blocked only by a genuine human-approval boundary. A due item may never end in a passive state such as “error found”, “retry later”, or “mail sent”.

This design makes publication a first-class Powerhouse outcome obligation across blog, LinkedIn and Instagram, with Brain/Datahub as the canonical evidence and learning layer.

## Existing foundation

The current estate already contains:

- `BG171 - Native LinkedIn Publish Executor v1` for native LinkedIn publishing.
- `BG179 - Native Instagram Publish Executor v1` for native Instagram publishing plus native media verification.
- `BG192 - Brain Deterministic SEO Publish Executor` for deterministic blog dispatch.
- `BG164` as independent blog/public production-proof ownership after dispatch.
- `PH Agent 15 - Post Guardian v3 stable runner`, which currently classifies publication problems and writes learnings, but does not itself own deterministic repair execution.
- `BG168 -> BG166 -> BG167` as the canonical Brain learning/writeback/shared-context path.
- Central Datahub/Notion publication records with immutable content/command identities and channel status fields.
- GitHub candidate-PR delivery and technical SEO gates for blog publication.

The missing capability is a single canonical controller that turns due publication into an explicit obligation, owns state transitions, dispatches the right executor, verifies production evidence, performs bounded repair, escalates repair work to the correct specialist, and only closes when evidence is present.

## Architecture decision

Use one deterministic `Publication Autonomy Controller` above existing channel-specific executors. Do not replace BG171, BG179, BG192 or BG164 and do not create a parallel publishing truth.

The controller owns orchestration and lifecycle state; specialist executors own channel-native side effects. PH Agent 15 becomes the intelligent diagnosis/repair-policy specialist used only when deterministic classification cannot fully resolve the failure.

Canonical flow:

`Brain/Datahub publication intent -> Publication Obligation -> deterministic eligibility + idempotency -> channel executor -> native/public readback -> bounded self-heal -> production proof -> BG168/BG166 learning -> closed obligation`

## Publication obligation model

Every due publication has one immutable obligation identity derived from canonical content identity, channel and intended publication slot.

Required fields:

- `publication_obligation_key`
- `canonical_content_id`
- `channel` (`BLOG`, `LINKEDIN_PERSONAL`, `LINKEDIN_COMPANY`, `INSTAGRAM`)
- `target_slug_or_native_identity`
- `scheduled_at`
- `approval_state`
- `dispatch_key`
- `attempt_count`
- `last_attempt_at`
- `state`
- `failure_class`
- `failure_fingerprint`
- `production_url_or_native_id`
- `production_verified_at`
- `owner_component`
- `attribution_root_key`
- `learning_written_at`

Allowed terminal/lifecycle states:

- `READY`
- `DISPATCHED`
- `VERIFYING`
- `SAFE_REPAIR_IN_PROGRESS`
- `PUBLISHED_PROVEN`
- `HUMAN_APPROVAL_REQUIRED`

`FAILED`, `ERROR`, `WARNING`, `REPAIR_REQUIRED` or `BLOCKED` are diagnostic facts, not acceptable terminal outcomes unless they resolve to `HUMAN_APPROVAL_REQUIRED` under an explicit hard boundary.

## Deterministic ownership

### Controller

The Publication Autonomy Controller must:

1. Read due and recently due canonical publication records.
2. Build or recover an immutable obligation key.
3. Check canonical approval, source identity, target channel, scheduled slot and duplicate state.
4. Detect already-published evidence before any dispatch.
5. Dispatch exactly one canonical executor for that channel.
6. Read back execution/native/public proof.
7. Classify failure from execution evidence.
8. Apply at most the bounded safe repair permitted for that fingerprint.
9. Re-run only when idempotency proves duplicate risk is zero.
10. Persist failure, root cause, repair, outcome and prevention through BG168/BG166.
11. Keep the obligation open until publication proof or a true human boundary exists.

### Channel executors

- Blog: BG192 dispatches candidate delivery; BG164 owns independent production proof. GitHub/Netlify remain delivery infrastructure, not the business-state authority.
- LinkedIn: BG171 remains the only native LinkedIn side-effect executor.
- Instagram: BG179 remains the only native Instagram side-effect executor.

The controller must never publish directly to a channel when a canonical executor exists.

## Failure taxonomy and self-heal policy

### Class A: transient and idempotent

Examples: temporary network/provider error, rate-limit where replay is allowed, short-lived API failure.

Policy:

- Verify immutable target identity.
- Verify no publication evidence already exists.
- Perform one bounded retry.
- Re-read native/public proof.
- If still red, convert to Class B or C based on evidence; never loop indefinitely.

### Class B: repairable architecture/runtime defect

Examples:

- missing publish command state;
- broken source-to-publisher bridge;
- workflow credential lifecycle defect;
- invalid deterministic mapper/configuration;
- stale branch identity;
- missing projection field;
- verification route mismatch.

Policy:

- Do not retry the broken route blindly.
- Create a repair obligation with exact fingerprint and owning component.
- Use the specialist repair route/agent to make the smallest safe fix.
- Require regression proof.
- Resume the same original publication obligation after repair.
- Preserve original immutable content/channel identity.

### Class C: unsafe or human-boundary defect

Examples:

- publication not approved;
- legally/financially binding claim requiring approval;
- missing credentials that require a human authorization ceremony;
- privacy/security policy boundary;
- contradictory approved copy/content identity.

Policy:

- Fail closed.
- State becomes `HUMAN_APPROVAL_REQUIRED` only when the exact required human action is recorded.
- Do not rewrite approved copy just to make publication succeed.

## GitHub blog-delivery repair requirement

The currently observed blog failure occurs after successful article generation, deterministic contract checks and commit, at candidate branch publication. The workflow must not depend on an authentication credential that an earlier third-party action invalidates before `git push`.

Required change:

- Restore the canonical repository credential immediately before deterministic Git operations that require it, or use an explicitly scoped GitHub token through the established authenticated remote pattern.
- Add a regression test/check that proves the authenticated remote is usable at candidate-branch publish time.
- Preserve candidate-PR-only delivery; never bypass the PR/production authority chain by pushing directly to `main`.

## PH Agent 15 role

PH Agent 15 remains the intelligent publication specialist, but its role changes from passive advisor to repair-policy participant.

It may:

- inspect shared Brain context and known-error fingerprints;
- interpret unfamiliar failure evidence;
- return exact failure class, fingerprint, safe repair policy and owner;
- invoke only explicitly exposed safe repair tools/subscenarios;
- write material learning through BG168.

It may not:

- directly create duplicate posts;
- bypass channel approval or copy gates;
- invent missing publication identity;
- override deterministic idempotency;
- perform infinite retries.

Known failure fingerprints should be handled deterministically without an AI call when possible, to control Make credits.

## Detection strategy

Use event-driven execution wherever existing flows can call the controller after content becomes approved/due or after a publisher returns a failure. Add one low-cost recovery sweep for missed events and legacy records.

Recovery sweep requirements:

- bounded record count;
- only due/recently due unresolved obligations;
- no AI call when state can be classified deterministically;
- no paid external search/DataForSEO call;
- dedupe by obligation key;
- old unresolved obligations processed before new non-urgent work.

## Verification contract

A publication closes only with channel-appropriate evidence.

Blog:

- candidate delivery succeeded;
- required CI/technical SEO gates green;
- promotion/merge through canonical authority completed;
- production URL is reachable and canonical identity matches;
- BG164 records production proof.

LinkedIn:

- native create call succeeded;
- native post/share identity exists;
- canonical record is updated with publication evidence.

Instagram:

- native create call succeeded;
- `GetMedia` readback verifies the native media identity;
- canonical record is updated with publication evidence.

A scenario execution reporting `success` is not sufficient production proof by itself.

## Brain learning contract

Every material publication failure or new improvement writes a normalized learning through BG168/BG166 containing:

- fingerprint;
- symptom;
- root cause;
- evidence;
- affected component/channel;
- failed/forbidden retry pattern;
- proven repair;
- regression/prevention contract;
- publication obligation key;
- production evidence;
- cost/operations impact where material.

Known-error learning must be read before repair. Repeated fingerprints should use deterministic repair before AI reasoning.

## Cost controls

- Deterministic-first classification.
- One bounded retry for Class A only.
- No AI call for known fingerprints.
- One low-frequency recovery sweep, plus event-driven callbacks.
- No duplicate social/channel publishing.
- No DataForSEO/Tavily calls for publication recovery.
- Persist state so repeated sweeps are NOOP after resolution.

## Safety boundaries

Autonomous repair is mandatory inside safe reversible system boundaries. Human approval is only permitted for explicit policy, credential-authorization, legal/financial, privacy/security or irreversible external-action boundaries not already authorized by the canonical publication record.

An approved canonical social/blog publication is itself authorization to execute that exact publication; a routine technical retry or infrastructure repair does not require new approval when immutable identity and duplicate safety are proven.

## Success criteria

The implementation is complete only when all of the following are evidenced:

1. A due publication becomes a persisted obligation with immutable identity.
2. An already-published item produces NOOP and never duplicates.
3. A safe transient failure receives at most one retry.
4. A known architecture failure routes to repair rather than blind retry.
5. The current GitHub candidate-branch auth defect is regression-tested and fixed.
6. LinkedIn and Instagram continue using their existing native executors.
7. Blog continues through BG192/BG164 and candidate-PR/technical-SEO gates.
8. Recovery sweep finds unresolved due obligations and ignores closed ones.
9. Material failures/fixes write to BG168/BG166.
10. An obligation can close only as `PUBLISHED_PROVEN` or `HUMAN_APPROVAL_REQUIRED`.
11. The current overdue publication backlog is reconciled without duplicates.
12. Final readback proves no due approved publication is silently stuck in a passive error state.
