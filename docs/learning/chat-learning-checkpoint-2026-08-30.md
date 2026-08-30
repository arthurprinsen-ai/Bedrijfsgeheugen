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

## Hero video failure fingerprints + current candidate

The detailed canonical media contract is `docs/hero-video-iphone-contract.md` and must be read before hero/video/iPhone/Safari work.

Durable fingerprints from this chat:
- `hero|iphone|false-movement-proof`: the early 48 KB/Base64-v2 is not valid movement proof; only fresh device confirmation counts.
- `hero|media|controller-good-source-bad`: original V18/Pexels playback worked physically while a local OpenArt-transcoded source failed under the byte-identical controller. Candidate media/delivery must be investigated before touching controller architecture.
- `hero|pexels|guessed-cdn-url`: never derive a CDN filename from a provider pattern; resolve the official download/redirect and pin the actual result.
- `hero|iphone|same-provider-different-profile`: same Pexels CDN family did not guarantee equivalent iPhone behavior; fps/resolution/container/delivery profile remain relevant.
- `hero|fallback|legacy-people-flash`: the brief old-man flash came from a CSS fallback in addition to the `<video poster>`; QA must scan full generated HTML/CSS for forbidden legacy hero imagery.
- `github|agent-race|hero-builder-qa-409`: concurrent writers on hero builder/QA produced stale SHA/409 and incoherent expectations. One canonical writer per file/semantic scope; on conflict fetch current state and reconcile, never blind retry.

Baseline evolution:
- historical first physically accepted preview control: commit `3361ec315874c8ea4c3ceca844bb3e4c9e707be6`, Netlify deploy `6a919798b6397000080985a7`;
- later production control is the physically accepted OpenArt derivative SHA `a261792e9b0058802ab5b30ce107c7ac14e8b2291a3bd7ee78fdb5968bbe97fd` from source SHA `d4a516304adebbf8067bceb034046ddd65e3ff62fd8e34c800115aeb226c89e0`;
- a new candidate never inherits physical acceptance from either control.

New OpenArt/Grok Imagine 1.5 generation from this chat:
- history id `uUxKRWcQkzWIPosutXVF`;
- raw media 1920×1088, 24 fps, ~8.04 seconds, audio present;
- raw URL `https://cdn.openart.ai/openart-ai/production/2026-08/create-video/WZvuT1BzGx566fWaFo8F/xai-video-143123ce-c19d-935c-a98f-0ffc678d4ae0_1787928916465_3c8704c8.mp4`.

This raw asset is creative source media, not an accepted hero. It must not be deployed directly as the new baseline. Normalize only as a candidate toward 1920×1080, 30fps, H.264, yuv420p, no audio and faststart, keep canonical controller/fallback/startup behavior untouched, use a versioned/hash-pinned artifact, and require a new exact iPhone PASS before promotion. Candidate normalization is not proof; physical acceptance remains the final gate.

## Customer portal auth / legacy UI recovery

Canonical fingerprint: `portal|customer-auth|legacy-inline-login-jitter`.

The IJsselmonde incident proved that mixed Netlify Identity, Supabase customer auth and legacy portal render ownership can create a false diagnosis trap: password auth, RLS and offer reads can all return healthy evidence while the editable login surface remains unusable on iOS because the large legacy document rebuilds auth DOM, loses focus and visibly jitters.

Canonical recovery:
- `klant-login.html` is the single editable customer-auth boundary;
- Supabase performs password/magic-link authentication and RLS authorization;
- customer session/state is persisted outside the legacy inline login lifecycle;
- unauthenticated legacy `toonInlog` redirects to the isolated login instead of rendering `bgMail`/`bgWw`;
- return to the same customer slug and existing portal after successful access verification;
- preserve the existing offer/sprint/customer data path rather than replacing the portal as a side effect of an auth repair.

Known failed approaches that must not be repeated without new evidence: only bypassing Netlify Identity, only changing reload/direct-open behavior, only adding session persistence, or stacking more inline-field patches while multiple auth/render owners remain. If backend auth and data are green but the UI is unstable, identify ownership boundaries before changing credentials, RLS or data logic.

A device/UI incident closes only with device outcome evidence. HTTP 200, successful Supabase API calls, green CI and Netlify `READY` are supporting evidence but do not prove that an iOS user can actually type and complete login.

## Shared-memory governance lessons from this chat

Before proposing any new memory/learning subsystem, inspect the existing memory architecture before creating a new memory subsystem. This repo already has `AGENTS.md`, `docs/development-ledger.md`, `docs/self-healing-agents.md`, the Shared Agent Memory design, `config/brain-chat-learning-contract.json`, canonical chat checkpoints and BG166/BG167/BG168 writeback. New learning belongs in those existing truths unless evidence proves a genuine architectural gap.

A real governance gap was found: Shared Agent Memory CI protected `automation/**` pushes and pull requests to `main`, but not direct pushes to `main`. As a result, direct pushes to `main` could change memory contracts without running the memory suite. The workflow now includes `main` under the push trigger, and `tests/development-doc-contract.test.mjs` verifies that trigger remains present.

The first run after closing that gap correctly went RED and exposed a test-quality issue: the memory assertion searched for `production evidence` case-sensitively while the ledger contained `Production evidence`. The repair was to make that semantic evidence assertion case-insensitive instead of changing valid production documentation merely to satisfy casing. Reusable rule: contract tests should be strict on meaning, identifiers, invariants and exact machine values, but not accidentally brittle on irrelevant prose capitalization.

### Manual connector write governance

Canonical fingerprint: `repository|manual-connector-write|default-main-bypass`.

A second governance failure in this chat was not a missing rule but a gap between rule and execution path. The Brain already contained `NEVER_TDD_DIRECTLY_ON_MAIN`, yet a manual GitHub connector write with `branch omission` can fall back to the repository default branch. Because live GitHub readback showed `main` as `protected:false` with enforcement off, authorized connector capability could bypass the intended candidate/PR route even though later post-push CI still ran.

Permanent prevention rule: `REQUIRE_CANDIDATE_BRANCH_FOR_MANUAL_REPO_WRITES`.

Required behavior for every material manual repository mutation:
- read current `main` first;
- create a fresh non-`main` candidate branch from that exact SHA;
- pass that candidate branch explicitly to every write action;
- perform RED/GREEN on candidate SHAs only;
- run the existing Shared Agent Memory and Unified BRAIN gates;
- promote only the exact tested head and then read `main` back;
- never treat successful post-push CI as proof that a direct write was prevented.

Known failed approach: using an authorized connector `create_file`/`update_file` call without an explicit branch and assuming authorization equals governed delivery. It does not. Capability, governed delivery and platform enforcement are separate evidence classes.

The machine-readable lesson and active prevention rule were promoted through PR #670. Candidate `268170f348df8200e75afe95f81b126946a2b85b` passed Shared Agent Memory and Unified BRAIN; exact-head merge produced `85c3e38972a930b06857d55594c478603d6ec5ee`, followed by a successful post-merge Shared Agent Memory run.

Open hard boundary: native GitHub platform enforcement is not yet proven. Agent governance now requires candidate-only writes, but full prevention exists only when GitHub branch protection/ruleset enforcement independently rejects an unauthorized direct main-write before ref mutation. Until then `protected:false` remains explicit evidence that platform enforcement is incomplete.

## Instagram / Make native migration contract

Deze leerregels zijn canoniek voor toekomstige chats, Make-agents, content-agents en iedere migratie van legacy publisher/analytics naar native platformconnectors:

- Een create-response is niet hetzelfde als verified publicatie. `CreatePostPhoto` of `CreateAReelPost` moet gevolgd worden door native readback (`GetMedia`) en pas de geverifieerde platform-ID mag als gepubliceerd bewijs in Notion/Canonical State worden geschreven. Create ≠ verified.
- Een Notion update mag alleen lopen als een echte Notion page-ID bestaat. Een lege search sentinel (`__IMTLENGTH__ = 0`) is geen record; guard downstream writes met een expliciete `id exists`-voorwaarde. Anders ontstaat de bekende `[400] Invalid request URL`-fout.
- Native Instagram-ID's en Buffer/legacy-ID's blijven strikt gescheiden. Native records mogen nooit door de Buffer-route worden gestuurd; legacy analytics blijft alleen bestaan voor aantoonbaar legacy verkeer. Successor/compatibility mapping wordt vóór uitvoering geraadpleegd.
- Na 429/502 of een andere ambiguë mutation failure geldt read-after-error: eerst scenario/execution/state teruglezen, daarna alleen retryen wanneer het bedoelde effect aantoonbaar ontbreekt. Geen blinde retries en geen dubbele betaalde runs.
- Advanced Meta/Instagram Insights blijft fail-closed totdat de exacte moduleparameterisering en metrics per media type tegen echte live data zijn bewezen. Een connector-call die `metric is required` teruggeeft is geen geldige analytics-route; niet omzeilen met gokwerk of silent fallback naar Buffer.
- Gebruik één canonical Instagram Business connection per productiechain voor create, verify en readback. Vermijd parallelle credentials voor dezelfde chain tenzij er expliciete failover-evidence en governance voor bestaat.
- Tijdelijke diagnostics/probe-scenario's zijn testharnassen: read-only waar mogelijk, bounded, na bewijs weer inactief en nooit stil onderdeel van productie laten worden.
- Native basic metrics mogen alleen naar Notion en learning/Datahub als post-ID en native-record matchen. Snapshot-dedup gebeurt vóór create/write; een identieke combinatie van post-ID + likes + comments produceert geen nieuw learning-record en geen extra context-refresh.
- Een technisch succesvolle scenario-run zonder verschuldigde side-effect is alleen groen wanneer no-op semantisch correct is. Bij publishing is succes pas bewezen als status, publicatiecheck, geverifieerde post-ID/permalink, daadwerkelijke publicatietijd en actieve publisher-route aantoonbaar overeenkomen.
- Retired/historical foutmeldingen zijn audit history, geen actuele productieproblemen zonder recente reproduceerbare evidence. Controleer scenario-status, `lastEdit` en post-fix executions voordat iets wordt gemuteerd.
- Buffer/legacy analytics mag pas definitief retired worden nadat een actuele volledige run aantoonbaar zero-legacy/0 legacy verkeer verwerkt én de native successor zelfstandig de benodigde outcome- en learningverplichtingen afdekt.
- Kostenregel: diagnostiek gebruikt eerst goedkope read-only existing-media checks; forceer nooit een publicatietest door QA/publicatiepoorten te verzwakken. Vermijd per-record AI-fan-out voor deterministische ID-, status-, dedupe- of metricschecks.

Bekende fingerprints/preventiepatronen uit deze migratie:
- `instagram|publish|create-without-readback-verification` → verplicht create → GetMedia verify → commit verified ID.
- `instagram|notion|empty-search-sentinel-update` → downstream update vereist echte page-ID.
- `instagram|routing|native-id-entered-buffer-legacy` → native marker/successor gate vóór legacy route.
- `instagram|insights|metric-parameter-not-live-proven` → advanced insights uit/fail-closed totdat echte live proof bestaat.
- `instagram|connection|parallel-credentials-same-production-chain` → consolideer op één canonical connection.
- `instagram|diagnostic|temporary-scenario-left-active` → na bewijs deactiveren en niet als production truth projecteren.
- `instagram|learning|duplicate-basic-metric-snapshot` → fingerprint/dedup vóór Datahub-write.
- `instagram|legacy-retirement|retired-before-zero-legacy-proof` → pas retire na actuele zero-legacy evidence en bewezen successor coverage.

## Website baseline / wrong-source recovery

Canonical fingerprint: `website|baseline|prototype-view-mistaken-for-production-route`.

PR #187 is the negative reference case. It used PR #110 / `prototype-v18-6.html` as if that prototype were the canonical production information architecture and derived standalone primary routes such as `/prijzen`. That source assumption was later proven wrong and PR #187 was closed without merge.

Permanent prevention contract:
- A prototype/test view is **never automatically a production route baseline**. Visual or homepage acceptance does not imply acceptance of every prototype view as a standalone production route.
- Before restoring pages, menus or information architecture, inspect the actual historical production commits, route files, sitemap and navigation state. These outrank inferred prototype structure unless explicit acceptance proves otherwise.
- A candidate can be technically green and still be wrong when it is built on the wrong business baseline. Source-of-truth selection is therefore a preflight gate, not a post-build detail.
- When baseline evidence conflicts with user feedback or production history, stop promotion, retire the unsafe candidate and reconstruct from the real last-known-good production state.
- Restore only the incorrect website/content/navigation layer. Preserve later Brain, portal, security, analytics and infrastructure improvements unless direct evidence says they are part of the regression.
- After correction, encode the actual route/navigation catalog as a regression contract so future agents cannot silently resurrect rejected prototype-only routes.

Known failed approach: making a candidate technically green first and only later discovering that the chosen baseline itself was wrong. Future agents must validate business/source truth before spending CI, Netlify, Make or agent budget on implementation and promotion.

## Development-speed rules

To make future work faster:
- inspect current state first; other agents/chats may have advanced `main` or Make scenarios
- reuse exact known-good patterns and hashes
- prefer deterministic guards over repeated AI calls
- use tiny clean diffs and exact-head PRs
- separate test harnesses from merge candidates
- close unsafe broad prototype PRs without merge
- validate the accepted production/business baseline before building or optimizing a candidate
- encode each discovered failure as a regression contract or fail-closed gate
- treat cost, latency, security and production outcome as first-class evidence fields

## Regression checklist for future agents

Before declaring a change complete:
1. confirm current base/state
2. confirm the selected source/baseline is the actual accepted production/business truth
3. reproduce or prove the actual root cause
4. establish RED where practical
5. make one minimal change
6. establish GREEN on exact candidate
7. verify no unrelated diff/config drift
8. verify preview/runtime as relevant
9. promote only exact tested candidate
10. verify resulting production externally
11. write outcome, fingerprint, fix and prevention into shared memory

Any future agent that encounters one of the fingerprints or failure modes above should reuse the documented fix/prevention first and only form a new hypothesis when fresh evidence contradicts the existing one.