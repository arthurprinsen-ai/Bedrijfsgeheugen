---
name: instagram-composio-publisher
description: Canonical Powerhouse Instagram publishing and recovery skill. Use for Mira reels/posts, direct Instagram delivery, Composio auth recovery, provider readback and transport incidents.
---

# Instagram Composio Publisher

Fingerprint: `instagram-composio-primary-v1`.

## Trigger

Use this skill for every Instagram publish, retry, recovery, transport incident, or scheduled delivery.

## Canonical path

1. Read canonical obligation, decision, artifact and existing provider identity before any side effect.
2. Require the existing exact-final-media proof. For Mira, require the visible-identity skill and `PROOF_VERIFIED`.
3. Re-run the pre-publish text/identity gate on the exact caption and exact media.
4. Publish through Composio as the primary Instagram write transport:
   - create media container with `INSTAGRAM_POST_IG_USER_MEDIA`;
   - publish it with `INSTAGRAM_POST_IG_USER_MEDIA_PUBLISH`;
   - read it back with `INSTAGRAM_GET_IG_MEDIA`.
5. Persist `external_id`, permalink and `provider_truth_verified=true` only after provider readback matches.
6. Feed outcome/evidence into obligation, runtime events, social learning and skill writeback.

## Authentication recovery

- Runtime authority requires `COMPOSIO_API_KEY`.
- `COMPOSIO_INSTAGRAM_CONNECTED_ACCOUNT_ID` is optional when exactly one active Instagram connected account can be discovered.
- Missing API key is `COMPOSIO_INSTAGRAM_AUTH_REQUIRED`.
- No active account is `COMPOSIO_INSTAGRAM_CONNECTION_REQUIRED`.
- Multiple active accounts without an explicit id is `COMPOSIO_INSTAGRAM_CONNECTION_AMBIGUOUS`.
- These states preserve the already proven media and remain resumable. Do not regenerate.

## Transport policy

- Make is retired and forbidden as execution, orchestration, recovery or fallback.
- Do not revive historical Make scenarios.
- Buffer may be used only as an explicitly authorized bounded secondary transport; a Buffer rate limit does not authorize Make.
- Never mark a post live from transport acceptance alone. Instagram/provider readback is mandatory.
- Never duplicate a post whose provider identity is uncertain; reconcile provider truth first.

## API contract

Use current Composio v3 tool execution: `https://backend.composio.dev/api/v3/tools/execute/{tool_slug}`. Do not route to the obsolete `/api/v3.1/tools/execute` endpoint and do not force an invented `version=latest`.

## Definition of done

Terminal success is: exact media proof green -> pre-publish gate PASS -> Composio publish -> Instagram readback -> canonical external_id/permalink -> outcome/learning writeback. Anything before provider readback remains recoverable/incomplete.


## Mira human-problem + fresh-OpenArt reel contract (2026-09-18)

For Mira Instagram Reels, the canonical content-production chain is:

`Powerhouse human problem -> concrete personal moment -> fixed Mira reference -> NEW OpenArt image2video asset -> exact-media/visible-Mira proof -> Composio Instagram publish -> Instagram permalink/readback -> canonical outcome + learning writeback`.

Hard rules:
- Instagram is Mira-only. Every Instagram artifact must declare `contentPersona=mira` and `contentClass=mira_daily_life`; every final visual must prove `miraPresent=true`. Generic Bedrijfsgeheugen brand cards, quote cards, blog promos, LinkedIn creatives and any other non-Mira creative are hard-blocked even when technically valid media.
- Start from a concrete personal problem that real people recognize: work/private overlap, school/children, planning, group chats, meetings, part-time handovers, forgotten agreements, social awkwardness, time pressure, mental load or small daily chaos.
- Recognition and human experience come first. Bedrijfsgeheugen meaning comes second.
- A Mira Reel requires a newly generated OpenArt video for that run. Existing OpenArt history items, earlier Mira MP4 URLs, old posts and prior-generation media may be used only as reference/evidence, never as the final asset.
- The fixed Mira reference may be reused to preserve identity; the generated output must have a new provider generation identity and URL.
- Do not replace a requested Mira Reel with a static quote/text card. Static cards are a different content format and cannot satisfy a Reel obligation.
- Do not fall back from OpenArt-required Reel/video to Placid or another media provider. Missing OpenArt execution readiness is a recoverable `WAITING_PROVIDER_CONNECTION` / equivalent state.
- Do not use Make.
- Before publish, check recent Instagram media and provider history for duplicate asset/script reuse.
- After publish, provider readback must return the exact published media id, Reel type, timestamp and permalink before the obligation is terminal.
- Write final post id/permalink, asset identity, prompt/script, publish timestamp, outcome and subsequent performance learning back to the canonical Powerhouse/Notion lineage.

Learning fingerprint: `mira-human-problem-fresh-openart-reel-v1`.


## Atomic publication claim and duplicate prevention

Fingerprint: `social-publish-atomic-claim-dedupe-v1`.

Every social side effect is single-writer and idempotent. Before Composio, Buffer, or any future provider receives a publish/create request, the canonical `powerhouse_channel_decisions` row must be atomically claimed from `content_ready` to `dispatching` with a compare-and-set predicate on the same run date, channel and decision. Only the run that obtains the claim may call the provider. A concurrent run that cannot claim must return `ALREADY_CLAIMED_OR_DELIVERED` and must not publish, regenerate or create a replacement.

A retryable transport failure that is proven to occur before the provider side effect may restore `dispatching -> content_ready`; uncertainty after a provider call is never permission to retry. Reconcile provider truth/external identity first. Provider readback and canonical external id remain mandatory before publication is considered delivered.


## Mira-only channel containment (2026-09-19)

Fingerprint: `instagram-mira-only-channel-hard-gate-v1`.

The Instagram company channel is semantically owned by Mira. Publication must fail closed unless the exact artifact is explicitly Mira, the exact final media visibly contains Mira, and the content class is `mira_daily_life`. A generic Bedrijfsgeheugen visual can never be reclassified as Mira merely to pass transport. Unknown identity, missing persona metadata, generic brand creative, or contradictory visual evidence must block scheduling and publishing. There is no fallback from rejected Instagram content to a generic company post.


## Mira visual-or-reel only hard containment (2026-09-20)

Fingerprint: instagram-mira-visual-reel-only-v2.

Instagram has exactly two permitted final formats: a Mira visual (image) or a Mira Reel (reel). video, carousel, text-only cards, quote cards, spreadsheet/file-name joke cards, generic Bedrijfsgeheugen brand creatives and template-first Placid creatives are not valid Instagram deliverables.

Hard pre-publish proof for every final asset:
- contentPersona=mira and contentClass=mira_daily_life;
- exact-final-media hash/proof exists;
- Mira is visibly present and is the central subject;
- vision proof says daily_life_scene=true;
- text_dominant=false and brand_template_dominant=false;
- static Mira visuals are generated by OpenArt and verified at 1080x1350;
- Mira Reels are newly generated by OpenArt, MP4 1080x1920, with start/middle/end frame proof;
- any missing, ambiguous or contradictory field fails closed before scheduling/publishing.

No transport, agent, direct Instagram call, Buffer call, Composio call, retry route or fallback may bypass this rule. A generic company post must be rerouted to the proper company channel, never reclassified as Mira.


## Central publication authority — mandatory runtime choke point (2026-09-20)

Fingerprint: central-social-publication-authority-v1.

A Mira rule is not considered enforced merely because it exists in prompts, learning, tests or channel metadata. Every Instagram external side effect must pass the canonical powerhouse-social-publisher and consume a short-lived, one-time publication capability bound to the exact channel identity, final text hash, exact-final-media SHA and active policy version.

Mandatory containment semantics:
- no direct Buffer, Composio or Instagram write path outside the canonical publisher;
- no provider write before capability consumption;
- an invalid already-scheduled provider item is PENDING_PROVIDER_CANCELLATION, never safely BLOCKED;
- only successful external cancellation/readback may establish CONTAINED;
- a transport sent/scheduled result never substitutes for Mira identity or exact-final-media proof;
- future Instagram publisher routes must inherit this authority and cannot introduce a parallel writer.

This invariant is machine-enforced in database capability RPCs, publisher runtime, provider-containment sweep, completion evidence and CI anti-bypass tests.


## Production readback requirement

The central-social-publication-authority-v1 invariant is currently production-proven by the canonical evidence lineage. Do not preserve or reissue LIVE_PROVEN merely from code/PR/merge state. A material publisher change must re-prove all of the following: capability table/RPC existence and definitions, active exact-source Edge Function deployment with intended auth mode, fail-closed endpoint behavior, and provider containment/pending-queue readback.

Production evidence fingerprint: central-social-publication-authority-v1-live-proof-2026-09-20.


## Ex-ante daily winner lineage

Fingerprint: `instagram-mira-winner-selection-v1`.

Before any Instagram media generation or publication attempt, call/reuse the canonical daily winner contract. Exactly one `powerhouse_instagram_daily_winners_v1` row may exist per run date.

- The winner is selected before media generation and is immutable for that date.
- Only Mira daily-life image/Reel recommendations are eligible. Reel winners require the OpenArt route.
- The winner `recommendation_id` and `score_version` must remain identical across channel decision, media job, artifact, publication capability, provider/readback row and learning outcome.
- Never independently re-rank inside a downstream publisher or media worker after the daily winner exists.
- The winner/media-job format is authoritative for Instagram normalization. A Reel must be written/read back as `reel`; do not inherit a stale `carousel` value from an experiment recipe.
- Publication authority fails closed on `INSTAGRAM_DAILY_WINNER_REQUIRED`, `INSTAGRAM_DAILY_WINNER_LINEAGE_MISMATCH`, `INSTAGRAM_DECISION_WINNER_LINEAGE_MISMATCH`, or winner/media-format mismatch.
- A blocked media/provider boundary does not permit selection of a second winner or fallback publication. Reuse the same winner and exact-media lineage when recovery becomes possible.
- Metrics and learning must write back to the same winner row; do not attach outcomes to a different recommendation after publication.


## Reel proof aggregation and runtime identity

Fingerprint: `instagram-reel-proof-runtime-drift-v1`.

For Mira Reels, the aggregate proof must preserve the strictest frame-level identity fields instead of reconstructing a weaker summary. The aggregate is valid only when every required frame proves `mira_central_subject=true`, no required frame is text-dominant or brand-template-dominant, and all other exact-media/Mira gates pass.

Before terminal publication claims, compare the active Supabase Edge Function runtime against canonical GitHub source for the router, verifier, orchestrator and publisher. Runtime/source drift is a blocking delivery defect, not a harmless deployment detail. After any fix, re-run the same immutable daily winner and exact asset; never generate a second winner to escape a failed writeback.

A successful proof write is not sufficient by itself. Require readback of the aggregate proof, `PROOF_VERIFIED` media job, approved publication obligation, generated Instagram artifact, provider dispatch/readback, `social_posts.format=reel`, matching winner recommendation/score version, and winner outcome/learning closure.


## Accepted daily-winner lifecycle

Fingerprint: `instagram-accepted-winner-downstream-lineage-v1`.

After the canonical selector freezes the daily Instagram winner it may transition that recommendation from `suggested` to `accepted`. Downstream orchestrator/publisher logic must continue to accept that exact recommendation only when its ID matches the persisted daily-winner row and `evidence.daily_winner=true`. This exception is winner-specific; generic recommendations keep the stricter suggested/empty eligibility rule. Never select a second winner because the frozen winner is already `accepted`.



## Channel-specific pre-publish rule scope

Fingerprint: `instagram-prepublish-business-rule-scope-v1`.

Instagram Mira must not inherit generic company-page rules such as mandatory Bedrijfsgeheugen tracking links, business CTAs or a forced business moral. Generic business-rule evaluation is scoped to `linkedin_company` only. Instagram remains fail-closed on its dedicated Mira identity, exact-final-media, dimensions, provider, final-asset, dedupe and publication-authority gates.


## Instagram transport preflight and bounded fallback

Fingerprint: `instagram-daily-mira-provider-isolation-v1`.

Before an Instagram publication claim or publication-capability issue, verify canonical Composio auth and the Buffer circuit state. Composio remains the primary transport. If Composio auth is unavailable while the Buffer circuit is open, keep the same proven Mira Reel recoverable at `content_ready` and perform no provider mutation. If Composio auth is unavailable and the Buffer circuit is closed, Buffer may be used only as the explicitly governed secondary Instagram transport through the same canonical publisher, exact-media proof, Mira Reel-only gate, one-time publication capability, atomic claim, dedupe and provider readback. A 429 reopens the circuit and reuses the exact same proven asset after cooldown. Never regenerate to escape a transport failure and never use Make.


## Composio Instagram bootstrap

Fingerprint: `instagram-composio-connect-link-setup-v1`.

Use `powerhouse-composio-instagram-setup` as the canonical bootstrap/status controller for Instagram transport. It must:
- read `COMPOSIO_API_KEY` only from canonical secret storage;
- use Composio v3.1 managed auth configs and hosted Connect Links;
- require exactly one active Instagram connected account before publication resumes;
- fail closed on multiple active accounts or auth configs;
- never expose or log the Composio API key or Instagram OAuth credentials.

Do not improvise direct provider auth or switch transport providers.


## Admin-only Composio key onboarding

Fingerprint: `admin-composio-key-onboarding-v1`.

Use `/api/powerhouse-composio-config` through the authenticated Powerhouse admin surface to onboard or rotate `COMPOSIO_API_KEY`. The browser may send the key once over TLS but must never persist it. Netlify Identity + `isPowerhouseAdmin` is the human boundary; `x-bg-service-token` is the server-to-server boundary; `powerhouse_set_composio_api_key_v1` is the only allowed Vault writer and can mutate only `COMPOSIO_API_KEY`. Validate the candidate key against Composio before storage.


## SECURITY DEFINER revocation contract

Fingerprint: `security-definer-explicit-execute-revocation-v1`.

For every server-only Supabase `SECURITY DEFINER` function used by this publication/onboarding chain, revoke execution explicitly in the same migration with `REVOKE EXECUTE ... FROM public, anon, authenticated`, then grant only the required server role. Do not rely on `REVOKE ALL` for this contract.


## Provider-isolated scheduled resume

Fingerprint: `instagram-buffer-independent-resume-v1`.

Scheduled social delivery must invoke the canonical publisher before any Buffer provider read. Instagram/Composio is an independent lane and must continue when LinkedIn/Buffer is rate-limited or unavailable. Buffer failures may defer LinkedIn, but must never fail or suppress the Instagram canonical attempt.


## Immediate OAuth completion resume

Fingerprint: `composio-oauth-immediate-resume-v1`.

After hosted Composio OAuth is opened, Control Center may poll setup status only for a bounded period. When exactly one ACTIVE Instagram account is observed, invoke exactly one admin-authenticated `resume` action. Resume must call the canonical `powerhouse-social-publisher`; never publish directly or bypass Mira identity, exact-media, capability, idempotency or provider-readback gates.

## Mira Reel only hard gate v3 (2026-09-21)

Fingerprint: instagram-mira-reel-only-v3.

This supersedes the older visual-or-reel allowance. The connected bedrijfsgeheugen.nl Instagram account has exactly one valid publication class: a Mira Reel.

Hard invariants:
- every Instagram publication must have contentPersona=mira and contentClass=mira_daily_life;
- final media kind must be reel; images, static cards, feed-image fallbacks, carousels, stories and generic videos are forbidden;
- final media must be a newly generated OpenArt MP4 at 1080x1920;
- exact-final-media SHA/proof is mandatory;
- vision proof must show Mira visibly present and central in a genuine daily-life scene;
- start/middle/end frame evidence is mandatory and every required frame must preserve Mira identity;
- text-dominant, brand-template-dominant and generic Bedrijfsgeheugen creative fail closed;
- missing provider/video readiness creates a recoverable blocker; it never authorizes an image fallback;
- only powerhouse-social-publisher may perform the Instagram provider mutation after one-time publication-capability consumption;
- provider readback must prove the published media is the exact Reel before terminal success.

No Mira or not a Reel means no Instagram publication.



## Meta Instagram OAuth onboarding and token lifecycle (2026-09-21)

Fingerprint: `instagram-meta-oauth-onboarding-v1`.

- Direct Meta credentials must be acquired through Instagram OAuth from an authenticated Powerhouse admin surface; do not ask users to paste long-lived runtime tokens into browser storage.
- Store Meta App ID/App Secret and Instagram access token/user id only server-side in Supabase Vault through service-role-only RPCs.
- OAuth state must be signed, short-lived and validated on callback before exchanging the authorization code.
- Request only `instagram_business_basic` and `instagram_business_content_publish` for the Mira publishing path unless another documented capability requires more.
- Exchange the short-lived authorization token for a long-lived token server-side, validate `user_id` + username via `graph.instagram.com`, then store runtime credentials.
- Refresh the long-lived token on a bounded daily schedule. Missing auth is a fail-closed configuration state and must never cause blind duplicate publication.
- Exact redirect URI: `https://www.bedrijfsgeheugen.nl/api/powerhouse-meta-instagram-oauth-callback`.

## Direct Meta primary transport (2026-09-21)

Fingerprint: `instagram-meta-direct-primary-v1`.

- The canonical Instagram writer remains `powerhouse-social-publisher`; do not create a parallel direct writer.
- Prefer the official Meta Instagram API when `META_INSTAGRAM_ACCESS_TOKEN` and `META_INSTAGRAM_USER_ID` are available.
- Direct Meta must create the Reel container, wait for processing `FINISHED`, call `media_publish`, and read back the exact resulting media id/permalink.
- If Meta returns a published media id but readback is temporarily unavailable, persist that exact id in `dispatching` / verification-pending state and reconcile it. Never issue a second publish to recover a readback failure.
- Composio is a bounded secondary transport when Meta direct auth is unavailable; Buffer remains the final bounded fallback. All transports remain subordinate to Mira-only, exact-final-media, atomic claim, one-time capability and dedupe gates.
- Missing Meta credentials are a configuration state, never permission to bypass publication authority or reuse a non-Mira asset.

## Daily Mira provider isolation and retry stability (2026-09-21)

Fingerprint: `instagram-daily-mira-provider-isolation-v1`.

- Never send a non-Buffer Instagram external id through Buffer reconciliation or containment. Provider ownership is authoritative.
- Buffer sync must read the canonical rate-limit circuit first and perform zero Buffer calls while `retry_at` is in the future.
- The same unresolved replacement/external-id blocker is one state, not a new attempt on every preflight. Increment retry/attempt lineage only when the blocker identity or provider state changes.
- Preserve and reuse the exact generated Mira Reel across auth/rate-limit recovery. No non-Mira content, image fallback, second winner or duplicate publication.
- Composio primary and bounded Buffer fallback are both subordinate to the same central publication authority and Mira Reel proof.


## Cross-runtime secret binding

Fingerprint: `composio-cross-runtime-secret-binding-v1`.

Do not infer that a secret configured in one runtime is available in another. The canonical Instagram publisher executes in Supabase, while the operator-facing configuration UI executes in Netlify. `COMPOSIO_API_KEY` must therefore be projected server-to-server through the authenticated canonical onboarding route. The bridge reads the Netlify secret only at runtime, performs a status-first preflight, writes only when Supabase lacks the key, and must never log, return, commit, or expose the secret value. The bridge is configuration plumbing only; it must never become a second publication writer.


## Immediate secure activation of scheduled configuration bridges

Fingerprint: `composio-secret-sync-deploy-trigger-v1`.

A Netlify scheduled function is intentionally not a public HTTP endpoint. When a security-sensitive cross-runtime configuration bridge must become effective in the same release, reuse its idempotent status-first operation from a production-only `deploySucceeded` platform event. Never add a public trigger merely to obtain immediate proof. The deploy-event bridge may synchronize configuration only; publication remains owned by the canonical social publisher and content loop.


## Netlify runtime environment API

Fingerprint: `netlify-serverless-env-api-v1`.

Use `process.env` for Netlify serverless Functions, including scheduled functions and platform-event handlers. Do not use `Netlify.env` there; that API belongs to Edge Functions. A production secret can be correctly scoped and still appear absent if the wrong runtime API is used.


## Authenticated immediate configuration recovery

Fingerprint: `composio-authenticated-immediate-secret-sync-v1`.

When a provider event demonstrably reaches the target but scoped secret visibility remains inconsistent and the provider-side cause is not proven, do not guess. Reuse the canonical idempotent configuration operation through a POST-only authenticated serverless control endpoint. Authenticate with an existing Powerhouse service secret by hash, never store the raw authentication secret in source, never expose the provider secret, and never grant the configuration endpoint publication authority.


## Runtime credential rotation proof

Fingerprint: `composio-runtime-secret-reload-v1`.

After rotating a Netlify Functions runtime credential, do not treat the control-plane update itself as runtime proof. Require a fresh production Functions deployment followed by provider and canonical Supabase readback before declaring the integration ready.


## Post-rotation deployment ordering

Fingerprint: `composio-post-rotation-runtime-rebuild-v2`.

For Netlify Functions credentials, compare the credential `updated_at` with the production deployment `published_at`. If the credential is newer, provider validation is not meaningful until a later protected Functions deployment is live. Fail closed and force exactly one post-rotation rebuild before re-validating.


## Composio tool-version execution rule (2026-09-22)

Fingerprint: `composio-v31-tool-execution-v1`.

- Direct Composio tool execution must use the v3.1 API surface (or an explicitly pinned modern toolkit version); never rely on v3's base-version default for current social tools.
- Connected-account ACTIVE state and tool execution success are separate proofs. A provider is usable only after the required read/write tool succeeds under the canonical account.
