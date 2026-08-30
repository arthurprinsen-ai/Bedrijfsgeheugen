# Chat Learning Checkpoint — 2026-08-30

Purpose: make the architectural, production, recovery, cost, security, media, Make, Notion, GitHub and Netlify learnings from the current work reusable by new chats and all agents. This is a canonical checkpoint, not a narrative recap.

## Non-negotiable operating contract

- Never stop at diagnosis when a safe repair path exists. Required loop: detect → root cause → regression test → minimal fix → retest → deploy/execute → independent verification → log learning → automate prevention.
- Never claim production, deployment, device/runtime, OAuth, Make, Notion, GitHub or Netlify success without fresh exact evidence.
- A green CI or Netlify `READY` is necessary but not sufficient for user-device runtime claims.
- Reuse existing controllers, stores and agents before creating new ones. Avoid duplicate watchers/guardians.
- Fail closed on unknown execution outcome. After a possibly state-changing write, never blind-retry until the resulting state is independently read back.
- Preserve exact-SHA / exact-tested-candidate gating for promotion.
- Prefer cheapest safe deterministic path before AI/agent fan-out.
- Transient 429/5xx platform noise should remain observable but should not automatically fan out into expensive learning/repair subflows.

## Hero media / iPhone runtime contract

Accepted media contract for iPhone-safe hero video:
- 1920×1080
- 30 fps
- H.264
- yuv420p
- no audio
- faststart
- autoplay + muted + playsinline + loop on the hero element

Critical lesson: source-safe profile alone is not enough. Physical iPhone/Safari playback advancement is a separate gate. Netlify `READY` does not prove runtime playback.

Do not change the canonical hero playback controller, playbackRate/defaultPlaybackRate, source switching, opacity logic or autoplay behavior while diagnosing a media-only problem unless evidence proves the controller is the cause.

The accepted production approach is a static/versioned, hash-pinned media asset. Avoid rebuilding/transcoding from an external OpenArt URL on every Netlify build: it adds network dependency, toolchain drift and build cost.

The previous accepted OpenArt candidate used:
- source SHA-256: `d4a516304adebbf8067bceb034046ddd65e3ff62fd8e34c800115aeb226c89e0`
- physically accepted derivative SHA-256: `a261792e9b0058802ab5b30ce107c7ac14e8b2291a3bd7ee78fdb5968bbe97fd`

A different derivative hash does not inherit physical-device acceptance, even when its technical profile is identical.

The hero was promoted only after physical iPhone PASS, exact-SHA CI, exact-head preview, merge guard and production Netlify verification.

## Current creative direction for replacement hero

Preferred visual direction from user approval:
- peaceful, inspirational premium drone flight
- modern waterfront city
- skyscrapers / glass high-rises
- broad urban boulevard and city details
- golden hour
- slow forward glide
- almost no people
- minimal traffic
- no hectic motion, no fast cuts, no text
- high-end technology / innovation atmosphere

OpenArt is connected and usable from ChatGPT. Do not state that OpenArt generation is unavailable without first using the connector. A generation may still fail for account/credit/model reasons; distinguish capability from account state.

## GitHub / Netlify production promotion

Promotion controller requirements:
- hard repository allowlist
- `pr_number` required
- exact tested candidate SHA must match PR head
- base SHA must match current `main`
- CI green
- deploy preview green
- rollback pointer exists
- exact-head merge guard
- read `main` back after merge
- independent Netlify production verification on the resulting SHA

Terminal states include at least:
- `OPEN_REPAIR`
- `PROMOTION_READY`
- `PRODUCTION_GREEN`
- `ROLLBACK_LAST_KNOWN_GOOD`
- `ROLLED_BACK_GREEN`
- outcome-unverified states after possible writes

Never force-push for normal rollback. The proven rollback pattern is history-preserving: create a new commit on current `main` using the last-known-good tree as its tree, keep current production as the parent, fast-forward `main` with `force:false`, read the result back, verify tree/parent/SHA, then verify Netlify production.

Important Netlify lesson: direct Git ref manipulation and Git-integrated deploy behavior can have timing differences. Treat Netlify itself as source of truth for deploy state; poll/verify the exact production commit rather than inferring from GitHub commit status alone.

## Central last-known-good state

`production:latest` is stored in the private Make control-state datastore and is the authoritative rollback source.

Rules:
- caller-supplied LKG must not override persisted LKG
- missing central state → fail closed
- only green terminal states may update persisted production state
- `OPEN_REPAIR` / BLOCK / unverified states must never mutate it

Repository tests were synchronized to enforce the same authoritative-state semantics as the Make controller.

## BG156 / BG160 closed-loop repair

BG156 is the closed-loop orchestrator. Key lessons:
- always return a terminal result for both authorized and blocked branches
- an `execution_authorized=true` decision is not the same as executed success
- after dispatching BG160, read/validate the executor outcome before returning success
- only auto-authorize mutation types BG160 actually supports

Current safe auto-executor scope is intentionally narrow: `SAFE_POLLING_CHANGE` only. Other proposed Class-A mutations remain proposal/blocked until they have their own snapshot → mutate → verify → rollback implementation.

Duplicate dispatch cost bug discovered: one connector retry created 4 identical full BG156 runs, 4 × 196 = 784 credits. Fix: pre-agent incident reservation/coalescing in shared private control state. Proven duplicate retry then cost only 8 credits and did not dispatch expensive agents.

## BG160 execution safety

BG160 uses idempotent reservations and exact-old-value preconditions. It must:
- reject protected control-plane scenarios
- require exact expected current value
- reserve idempotently
- mutate minimally
- verify resulting state
- rollback exact prior value if verification fails
- return explicit commit/no-action/rollback outcome

## Zero Trust / BG157

Use explicit producer allowlists, not syntactic source acceptance. Proven allowed sources include the actual control-plane producers and daily sentinel heartbeat. Spoofed/untrusted source must terminate with no continuity side effects.

Important regression found: BG150 was a legitimate producer but was missing from BG157 allowlist. Fixed by adding only BG150, not a wildcard. Always regression-test both allowed real source and fake source.

## BG150 daily sentinel

False-positive degradation root cause: reading the underlying execution too early and classifying `RUNNING` as degraded. Fix was to increase the completion buffer to 5 seconds before classification. Proven healthy result: `HEALTHY` + `SUCCESS` + exact `OK`, no degraded-log branch, while BG157 heartbeat still runs.

Do not treat a successful Make scenario status as proof every intended branch ran. Inspect modules for canaries/heartbeats when branch execution is part of the contract.

## BG82 runtime/cost guard

Schedule is 4-hourly. Search window is ~245 minutes, giving overlap; the old `65m` label is stale documentation only. Do not shorten the window or increase run frequency based on that label.

BG82 event-driven runtime guard replaces the error half of the old expensive deep audit. It:
- ignores RETIRED noise
- deduplicates by execution id
- persists unseen actionable incidents
- uses class-aware continuity/governed repair routing

Cost lesson: transient `429/5xx` errors stay visible as incident records but no longer dispatch per-scenario learning to BG166. This preserves observability while reducing burst fan-out costs.

## BG149 / BG181 performance monitoring

Old BG149 Daily Reliability Deep Audit accumulated ~4075 credits and was retired. Do not reactivate it.

Replacement split:
- BG82 = event-driven runtime errors
- BG159 = daily portfolio/cost/inactivity
- BG181 = bounded core runtime performance sentinel

BG181 monitors only three critical control-plane targets (BG82, BG156, BG169), reads only the latest run in 24h, locally checks duration/operations/transfer, and dispatches to shared learning only on a real anomaly. Initial green canary cost 12 credits and dispatched no anomaly.

## BG147 Activity API / Notion integration

Root cause of repeated `Could not find data_source` was not an incorrect data-source ID and not OAuth itself; it was Notion database sharing with the Make integration.

Correct recovery sequence:
1. confirm canonical Notion data-source ID
2. authorize Make↔Notion
3. explicitly share the database with the Make integration
4. read test through Make
5. write one recognizable canary
6. read exact canary back through Make
7. only then repoint/activate production module
8. restore/deactivate temporary probe harness

BG147 now uses an authorized Make↔Notion connection and its read/write/read acceptance passed.

Security note: BG147 custom webhook has no native auth field in the available Make CustomWebHook connector. Do not implement fake security by checking only a spoofable header such as `signature-agent`. The observed ChatGPT caller sends cryptographic signature headers, but Make does not natively verify that Ed25519 signature in the current webhook module. A real gateway/verification layer is required before calling it authenticated.

## Temporary test harness discipline

Temporary probes are permitted only when safer than production mutation. Mandatory rules:
- start inactive when possible
- record original blueprint before editing
- perform bounded test
- restore exact original function immediately
- deactivate afterward
- if Make renumbers module IDs, repair downstream mappings before leaving
- never leave a temporary probe active or broken after a 429/partial sequence

## Make rate limits / 429 handling

Repeated lesson: do not hammer Make after 429. A 502/429 can occur after the remote action was already accepted. Before retrying a mutating call, inspect execution/history/state to determine whether the action happened.

Prefer smaller atomic patches when Make’s branch validator/rate limiter makes multi-step flow edits ambiguous.

A Make branch-condition validator issue was observed: certain nested condition patches could be stored as catch-all branches. Always re-read the stored blueprint after structural branch edits; do not trust successful save alone.

## Content / BG74 blog-image flow

BG74 was safely reactivated only after narrowing selection to `Gepubliceerd + Beeldstatus = Nog geen beeld`, preventing replacement of existing images. Model/body fixes were already present. Acceptance canary correctly no-op’d when no candidate existed, costing 1 credit.

## Error-source handling

When BG82 surfaces old mails, do not automatically mutate the referenced scenario. First compare error timestamp with `lastEdit` and inspect post-fix executions. Several apparent errors (BG151, BG166, BG167, BG180, BG107, BG171, BG53) were historical or already fixed and post-fix green.

Rule: historical mail != current production defect.

## OpenArt workflow learning

OpenArt connector is available. For video generation:
- polish prompt and get user choice when required by connector flow
- pick model/mode fresh from actual intent
- text2video is appropriate when no literal first frame must be preserved
- image2video only when the supplied image must be the literal first frame
- generation is asynchronous; use result card behavior correctly

Current chosen concept: variant 1 — peaceful premium 10s 1080p 16:9 drone flight over modern waterfront skyline at golden hour.

## Development-speed rules

To make future work faster:
- inspect current state first; other agents/chats may have advanced `main` or Make scenarios
- reuse exact known-good patterns and hashes
- prefer deterministic guards over repeated AI calls
- use tiny clean diffs and exact-head PRs
- separate test harnesses from merge candidates
- close unsafe broad prototype PRs without merge
- encode each discovered failure as a regression contract or fail-closed gate
- treat cost, latency, security and production outcome as first-class evidence fields

## Portal/customer-auth continuity

The proven customer-auth recovery fingerprint is `portal|customer-auth|legacy-inline-login-jitter`.

- Root cause: mixed Netlify Identity and Supabase ownership plus the large legacy portal lifecycle caused the inline editable login DOM to re-render and lose focus/state on iOS.
- Proven architecture: isolate the only editable customer login in `klant-login.html`; the legacy portal redirects to it instead of rendering competing inline fields.
- Backend HTTP success is not enough. The incident closes only with device outcome evidence on the affected device/browser plus separate production/deploy evidence.
- Reuse this architecture before introducing another auth path or symptom patch.

## Chat-memory / CI continuity

- Never allow RED-first development tests or ordinary development mutations as direct pushes to `main`; work on an isolated candidate and promote only an exact green candidate.
- Before adding a memory layer, inspect the existing memory architecture before creating a new memory subsystem; extend canonical BG166/BG167/BG168/Company Graph memory instead of creating parallel truth.
- Contract checks that search canonical text must be deliberately case-insensitive when capitalization is not semantically meaningful; do not rewrite correct knowledge merely to satisfy brittle casing.
- Canonical checkpoint content and the contract test that requires it must change in the same candidate. A test-only push that makes `main` red is itself a governance failure.

## Delivery continuity learnings

- HTTP acknowledgement is not execution proof. A 200/accepted transport response must be followed by downstream execution/state readback and immutable outcome evidence.
- Make capacity/quota is a production gate. If capacity is paused or quota-exceeded, block that transport and do not claim production green without a separately verified governed failover.
- Client/browser caching alone does not reduce Make cost when source calls still execute. Cost optimization must reduce upstream invocations through events, deltas, shared cached state or other source-call elimination.
- Repository branch discovery must be read-only. Never perform a write merely to learn whether a branch exists; inspect the branch/ref first, then mutate only the proven target.

## Regression checklist for future agents

Before declaring a change complete:
1. confirm current base/state
2. reproduce or prove the actual root cause
3. establish RED where practical
4. make one minimal change
5. establish GREEN on exact candidate
6. verify no unrelated diff/config drift
7. verify preview/runtime as relevant
8. promote only exact tested candidate
9. verify resulting production externally
10. write outcome, fingerprint, fix and prevention into shared memory

Any future agent that encounters one of the fingerprints or failure modes above should reuse the documented fix/prevention first and only form a new hypothesis when fresh evidence contradicts the existing one.
