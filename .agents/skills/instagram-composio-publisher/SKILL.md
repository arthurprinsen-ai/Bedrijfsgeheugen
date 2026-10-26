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


## Preventive producer quality recovery (2026-10-25)

**Fingerprint:** `mira-original-owner-pre-generation-quality-feedback-v1`.
Never solve recurring verification rejects by lowering an identity/temporal score or reusing the same failed OpenArt history. The original Heartbeat should call the existing `powerhouse-instagram-media-router` **preflight** for a frozen source-led day. When the canonical media job contains a genuine quality rejection, the response exposes typed `preventive_recovery` with the original source, project, failed provider history, observed score and **one** bounded next-generation brief.

The one existing Mira producer must consume this production-derived brief **before buying another generation**:

- **Face failure** (`VIDEO_FRAME_CANONICAL_MIRA_FACE_MISMATCH`): confirm original immutable master in both original OpenArt image references; require native full-bleed 1080x1920, visible uncut face, no black bars/letterboxing/cropped head, stable expression/age and approved daily source-led scene. Reject unsupported input modes or provider output dimensions without spending on verification. If a native-portrait derivative becomes necessary, first request a separately reviewed, independent master-face PASS and update the protected media contract; **do not lie about the provider's original input reference**.
- **Temporal failure** (`MIRA_CONTINUOUS_VIDEO_PROOF_REQUIRED`): revise the next storyboard to depict one uninterrupted real scene with natural facial, hand and object motion, not a slideshow, pan/zoom or still-image animation. Keep the original reference identity and exactly the frozen source/scene/caption.
- Before buying: check today's existing OpenArt histories and the original Brain failure fingerprints. Reuse neither the rejected bytes/hash nor their provider history. Never continuously retry; at most one **new** candidate per independently classified failure and configured provider credit cap. A new generation is an opportunity to verify, not proof.
- After generation: check real OpenArt project/history, native 1080x1920 MP4, correct master references and source winner; then call the **same** original router with `submit_asset` (not a second publisher). Require real first/middle/end facial scores each ≥0.940, real temporal confidence ≥0.900, matching SHA and exact final caption before any one-shot Meta create.
- A quality failure keeps the channel `BLOCKED` with an actionable producer plan and original Brain incident; continue independent channels. No generic brand posts, fake PASS, hard-coded bogus media IDs or silent substitution of a static image for a promised Reel. Escalate human/provider credential or exhausted-budget constraints without infinite regeneration.
- A quality-complete generation still does not prove publication. Only provider media ID, permalink and independent readback may mark the Instagram obligation `LIVE_PROVEN`.

This plan is returned by the current router rather than creating a new scheduler, publisher, queue, customer data store or parallel agent. A successful production simulation is not a future guarantee; subsequent runs must repeat actual provider checks.

## Native MP4 quality gate before vision (2026-10-25)

**Fingerprint:** `mira-exact-native-mp4-before-vision-v1`. The original Mira media router and the existing Netlify `instagram-video-frames` function enforce this rule. The agent must never trust OpenArt response metadata, manifest width/height, or a padded 1080x1920 screenshot as evidence of the original video format.

Before spending credits on AI face/temporal evaluations, the existing frame extractor downloads the **exact original MP4**, probes the first real encoded video stream with the already installed ffmpeg binary and requires **native 1080x1920**. Failed/unknown stream metadata remains blocked; actual non-native dimensions are recorded on the same CAS media job and immutable Brain failure register with their exact provider history. A frame submitted by a caller cannot bypass this original-byte extraction. Only matching actual video dimensions allow independent start/middle/end face >=0.940 and temporal >=0.900 verification.

If the real format fails, use the existing original producer's `preventive_recovery` contract to choose a new genuinely native portrait output. The current failed candidate must not be resubmitted or claimed as verified by reframing, JPEG padding or an unapproved master/source switch. Limit regeneration to one distinct attempt per observed failure and the configured daily provider budget. Never spend new credits merely because preflight was polled again.

No additional scheduler, queue, sender, privileged connector or fake post ID. Even a correctly sized, quality-proven Reel is not live until the original authorized publisher returns Meta media ID/permalink and independent readback.

## Previously rejected OpenArt assets are permanently ineligible (2026-10-25)

**Fingerprint:** `mira-immutable-brain-rejected-history-before-vision-v1`. The canonical Brain `brain_failure_occurrences` row is the cross-run evidence, **not** the current media job's last_error. Two independently rejected histories must never be alternated to make an older failed clip eligible again. The ORIGINAL media router now looks up `router:openart:<history>:instagram:<date>:<failure stage>` by provider history prefix before MP4 download, native video probe and expensive AI identity/temporal verification. It blocks any previously rejected history **across all dates**, including exact photo, motion and native-video-format rejects. If the Brain read fails, no blind resend is allowed.

The same agent must load and deduplicate all real past provider histories before selecting a next candidate. A provider `COMPLETED` response is not a vision/identity PASS. After the original source-locked producer obtains a genuinely new history under the configured budget, send it only once through the canonical router; log the true independent outcome and never requeue a rejected candidate. A current-day Reel winner remains frozen; never silently replace it with a static visual. For new days, any image-vs-Reel format decision must occur **before** the daily winner is frozen and must satisfy the channel's current approved policy.

This prevents repeat evaluation charges and status loops; it does not guarantee generative videos pass the independent 0.940 face / 0.900 temporal gates, and it never permits unproven Instagram publication claims.

## Original Mira producer — reconcile facial identity AND real movement (2026-10-25)

**Fingerprint:** `mira-recognizable-face-and-genuine-human-motion-v1`.

Our actual failed paid generations exposed contradictory instructions: prompts demanded that every facial landmark/pixel be frozen, with no blink, breathing or movement, while the true independent temporal gate requires living continuous human movement. An immobile facial image surrounded by a moving phone or background is not a valid proof of human video. Three-frame face scores alone are insufficient, and a model's `COMPLETED` response is not approval.

**Mandatory original-producer behavior before one further OpenArt expenditure:**
- Read the canonical `preventive_recovery` from the current source-locked router. Consume its `motion_compatible_brief` only if `ok=true`; never independently reselect the topic, new source, master identity, post date or caption.
- Submit the exact *final* OpenArt prompt to `checkMiraProducerPromptCompatibility` in `supabase/functions/_shared/mira-preventive-quality-recovery.mjs`. Fail any request for frozen facial pixels/landmarks, no blink/breathing/hand movement, wholly static person or background-only animation. Real identity preservation means the same recognisable face **with small physically plausible movement**; it does not mean literal facial pixels are stationary.
- Render an uncut, genuinely native 1080x1920, 8-second, single-take `image2video` Reel. Use the immutable approved master as the actual OpenArt start/end input, retain approved scene and Mira's recognisable face, clothing, skin and hair. Request restrained natural blinking/breathing and a small finger/hand interaction with an object already in that scene; never invent scene props, logos, third-party claims, a second person or unfamiliar elements.
- Independent original-byte native MP4, actual start/middle/end face >=0.940, **temporal human-motion confidence >=0.900**, original Brain historical no-reuse check and exact-media hash remain mandatory. Start/end master input by itself is never evidence that the middle frame passes.
- Reconcile exact model/format and credit estimate with OpenArt before generating; use the existing single owner and bounded **one** genuinely different history within the configured budget. A failed or unavailable budget contract blocks provider expenditure; do not guess at entitlement.
- Any mismatch feeds the original Brain, provider provenance, and next producer brief. A successful candidate still is not `LIVE_PROVEN`: the existing Composio/Meta one-shot publisher must return authentic media ID, permalink and independent readback.

No new scheduler, agent runner, second publisher, customer data, threshold bypass, fake success or unlimited automatic regeneration. Do not substitute a static image for an already frozen Reel obligation.

## Proven provider output geometry BEFORE any OpenArt credits (2026-10-25)

**Fingerprint:** `mira-native-provider-output-prespend-v1`.

Wan 2.7 image2video's `resolution=1080p` is a PIXEL-TIER, not a promise of 1080x1920. Official model documentation says original first-frame aspect determines resulting geometry. **Actual** original-master project history `4y4xrXvVDidv9gUDQZea` was billed and COMPLETED yet returned **1292x1604, 8.08s, with audio** instead of the canonical exact native **1080x1920, silent 8s Reel**. The OpenArt `wan2-7:image2video` form has no output aspect-ratio parameter or mute parameter. Putting `9:16` in the prompt or inventing unsupported `aspectRatio`/`generateAudio` properties DOES NOT control the original MP4.

**Required original producer workflow before every NEW generation spend:**
1. Read the actual immutable Mira source winner/master, original Brain prior failures and original production router `preflight`; no new winner or static-image substitution for frozen Reel.
2. Call the EXISTING authenticated `powerhouse-instagram-media-router` action `generation_preflight` with `runDate`, `postType:"reel"`, `model`, `mode`, and EXACT proposed generation `params`. This action does not charge, generate, publish or mutate state. Refuse to call OpenArt generate_video unless it returns `provider_generation_preflight.ok=true`. Additional existing provider budget and dedupe checks are STILL required.
3. `wan2-7:image2video` with the immutable canonical master and `resolution=1080p` is a KNOWN BLOCKED configuration. Provider evidence and native output dimensions are linked in the returned failure. Do not reissue it, pad/crop the original reference, swap the Mira identity or relax the native-video gate.
4. Unknown model/modes require independently verified original OpenArt control surface and a protected policy update — do NOT guess that "1080p" means "9:16" or trust the render prompt as proof. Veo 3.1 with literal `aspectRatio:"9:16"` and `generateAudio:false` has verified **FORMAT** only; previous Veo faces failed, so a format-compatible response is NOT a recommendation to retry previous histories.
5. Actual generated MP4 is re-measured independently by original ffmpeg worker before expensive frame recognition; require real 1080x1920, original same face on first/middle/end >=0.940, real temporal movement >=0.900, and true one-shot Meta provider media ID/permalink/readback for publication. Never claim that a provider's `COMPLETED` receipt or a 1080p label means Reel acceptance.
6. To fix the recurring source aspect issue, any new 9:16 compositional derivative of the original master needs separate identity verification, source licensing and a protected original-master contract change **BEFORE** using it. This is not permission to bypass the original unmodified master reference.

The evidence and restrictions live in the same original Mira preventive module and Brain learning. No new publisher, scheduler, unlimited retries, paid speculative attempts or fake GREEN statuses.

## Derived 9:16 reference is NOT Mira master until independently verified (2026-10-25)

**Fingerprint:** `mira-outpainted-reference-independent-face-proof-v1`. The completed single-image OpenArt outpaint `4aOsUdQyAheL3wmex9Uq`, resource `aTtGOimC7CyaexG5cyTh`, is 1296x2304 (true 9:16). It remains an UNAPPROVED staging reference, not a Reel, a new original master or proof of pixel-exact face preservation. The original immutable fictional Mira master stays `Yjqu4D7v76HABNPmQPj1`.

To test it once, call the **existing original** authenticated `powerhouse-instagram-media-verifier` with `publicationDate` matching the frozen source, `provider:"openart"`, `mediaType:"image"`, `verificationRole:"reference_candidate"`, `writeObligation:false` and the exact OpenArt-generated PNG URL. This role accepts **only** the real 1296x2304 PNG/JPEG from the trusted original OpenArt CDN, and performs real independent two-image identity vision against the unchanged original Mira master; minimum face confidence remains **0.940**. A role-specific result `pass:true` proves only visual reference similarity, **not** pixel preservation, video validity, camera motion, Instagram upload, Meta provider proof or publication.

Every response has `reference_candidate_only=true`, `may_publish=false`, `final_media_proven=false`; the original daily Instagram obligation is never changed. A failed vision verdict or unavailable provider keeps the candidate quarantined: no OpenArt video spend. If the image passes, the original owner may propose a **separate protected PR** that explicitly registers the independently verified SHA, original-master lineage and exact derived-reference usage, while preserving the original source winner, image/video format and face/temporal thresholds. Neither a passing reference nor this skill silently rewrites `validMiraGenerationReference`, the publisher or the Mira master. A future video still must independently pass native 1080x1920, first/middle/end ≥0.940 and temporal ≥0.900, then a real Meta ID/permalink/readback.

The existing owner, Brain learning, original scheduler and publisher remain single-writer; no extra scheduler, speculative multiple provider attempts, arbitrary crop, identity swap, fake success or unlimited credits.

## Proof-pinned approved derivative input: original Mira master stays immutable (2026-10-25)

**Fingerprint:** `mira-source-locked-pinned-portrait-video-input-v1`.

Actual protected original verifier (PR #4935) independently compared the completed outpainted OpenArt `4aOsUdQyAheL3wmex9Uq` 1296x2304 PNG to unchanged original Mira master. Production pg_net #12791 HTTP 200 returned face identity confidence **0.950 ≥0.940**, face match, exact SHA-256 `242119866b6eaf9c142331e46b878df08c4f206fb4106fab2f48065b121b3b0a` and canonical original-master SHA `e32863f391e01dba910bf396ad13eb23c4a74b53f2614f1563b0fc332b1dd4e2`. Evidence resides in `powerhouse_media_proof_evidence_v1` as `reference_candidate_verified` but `identity_gate_result=UNPROVEN` for Instagram, `exact_final_media_proven=false`; original Instagram obligation is BLOCKED. This is only a visually matched **derived production input**, not pixel-level master identity or provider publication.

The existing producer may submit `generation_preflight` with `derivedReference` matching **exact** `MIRA_APPROVED_DERIVED_INPUT` history/resource/URL/SHA. The same original authenticated router queries canonical stored independent proof and verifies original immutable source winner/date/project/master and face evidence. It must return `derived_reference_proof.ok=true` and still separately pass `provider_generation_preflight.ok=true`; old non-native Wan 2.7 remains barred, only documented actual 9:16/no-audio-capable mode may be used. Then check current OpenArt quote, provider credits and configured one-candidate budget. Do not generate if any check fails.

When producing, the official original master remains `openart_reference_id=Yjqu4D7v76HABNPmQPj1` **for final visual comparison**. The actual OpenArt start/end input may use the explicitly certified DERIVED image, but it MUST be declared separately as `assetManifest.derived_reference` with the exact four pinned fields and read back from the original OpenArt provider response; never pass the derived ID as if it were the original canonical ID. The same original submit_asset verifies this evidence and writes a separate `mira_derived_generation_input` lineage record ONLY after full final-media proofs. A provider `COMPLETED` receipt is neither input readback proof nor a quality PASS.

The frozen parking-app source, caption, canonical master, SHA lineage, no historical rejected video history, native 1080x1920 muted output, start/middle/end face ≥0.940, real temporal movement ≥0.900 and one-shot actual Meta post-ID/permalink/readback remain mandatory. If the still-image composition does not physically contain the original approved smartphone/parking-app scene, do not invent altered elements or fake scene compliance. Classify this as a source-scene mismatch and seek an independently verified scene-compatible replacement from the ORIGINAL content owner before spending on video.

No second publishing lane, scheduler, arbitrary visual, unbounded retries, direct status green or status check bypass.

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


## Mira Reel recommendation-boundary normalization (2026-09-22)

Fingerprint: `instagram-mira-reel-seed-normalization-v1`.

The Reel-only v3 rule is enforced before daily-winner selection, not only at media verification. Every current or future `powerhouse_content_recommendations` row targeting `instagram` or `instagram_company` with `character=mira` and `character_mode=daily_life` must normalize to `format=reel`, `production_route=openart_video` and `reel_generator=OpenArt`. Legacy calendar seeds such as `carousel + placid_visual` are policy drift and must be normalized at the database boundary; they are never a valid reason to skip the day or fall back to a static image.

After normalization, reuse `powerhouse_select_instagram_daily_winner_v1(date)` / `powerhouse_ensure_instagram_media_job_v1(date)`. Exactly one immutable winner and one canonical media job remain authoritative. If the job reaches `WAITING_PROVIDER_CONNECTION` / `MEDIA_PROVIDER_UNAVAILABLE`, preserve the same winner/job and resume when OpenArt execution becomes available. Never create a second winner, substitute Placid, reuse an old MP4, or bypass exact-final-media proof.


## Post-rotation deployment ordering

Fingerprint: `composio-post-rotation-runtime-rebuild-v2`.

For Netlify Functions credentials, compare the credential `updated_at` with the production deployment `published_at`. If the credential is newer, provider validation is not meaningful until a later protected Functions deployment is live. Fail closed and force exactly one post-rotation rebuild before re-validating.


## Provider identity health preflight (2026-09-26)

Fingerprint: `social-provider-health-preflight-v1`.

Composio ACTIVE status alone is insufficient. Before Instagram publication capability issuance/consumption, the setup controller must call provider identity readback for every active candidate and accept only a live account whose username is exactly `bedrijfsgeheugen.nl`. Stale, revoked, unauthorized and wrong-identity accounts are rejected and do not create ambiguity.

When multiple healthy candidates exist, prefer the single account with alias `bedrijfsgeheugen-mira-canonical`; otherwise fail closed. The publisher consumes only the health-verified account recorded by `powerhouse-composio-instagram-setup`. A reauth or identity failure preserves the exact proven Mira Reel at `content_ready`; no publication capability is consumed and no new Reel is generated to escape auth recovery.


## Daily no-gap publication invariant (2026-09-28)

Fingerprint: `instagram-daily-no-gap-self-healing-v1`.

An approved Instagram company obligation must not silently expire because media, auth, identity proof or transport state is incomplete. The daily closed loop owns recovery until the exact Mira claim is either provider-published with readback or reaches a genuine external hard boundary.

Hard rules:
- before the daily publish window, verify canonical Instagram identity, Composio token health, final-media readiness and exact Mira proof;
- if media is missing, generate/finish the required fresh Mira OpenArt asset inside the same claim instead of leaving `MEDIA_ASSET_REQUIRED` as a terminal state;
- if an OAuth token is unhealthy, preserve the exact claim/media and resume after repair; never regenerate merely because auth failed;
- if provider create succeeds, persist the media/post ID immediately and forbid republish even when later readback fails;
- daily watchdog retries only proven pre-provider failures; uncertain/provider-created states enter reconciliation only;
- no Buffer or Make fallback is allowed;
- no generic Bedrijfsgeheugen visual may satisfy the Mira channel;
- every Amsterdam calendar day with an approved Instagram obligation must be checked again after its intended publish window; missing publication evidence automatically re-enters the same recovery lineage.

The objective is not “attempt every day” but “close every daily obligation without duplicate side effects”.

## Cross-channel semantic uniqueness (2026-09-28)

Fingerprint: `powerhouse-global-semantic-example-uniqueness-v4`.

Instagram generation must reject any concrete example/story family already consumed by another retained social publication. A different caption, Mira treatment, visual, hook or CTA does not reset uniqueness. When overlap is detected, select a materially different story family before media generation or provider dispatch.



## Existing provider side effect outranks later media-proof drift (2026-09-28)

Fingerprint: `instagram-provider-write-terminal-v1`.

Once Instagram returns a durable published media ID, the daily claim is terminally published for anti-duplicate purposes. Later changes in media-generation metadata, missing exact-final-media proof, or a stricter future identity/media gate may affect future content generation but may never retroactively invalidate, replace or duplicate an already-created provider post.

Hard rules:
- persist the Instagram media ID immediately after publish success;
- set `provider_create_success=true` and `republish_forbidden=true`;
- if provider readback has already verified the media, later media-proof drift cannot set the obligation back to BLOCKED;
- media-quality/identity learnings discovered after publication are prospective controls for the next claim, not grounds to republish the current claim;
- watchdogs reconcile the existing media ID only.


## Provider-created social side effects are terminal across channels (2026-09-28)

Fingerprint: `provider-write-terminal-all-social-v1`.

Once Instagram returns a durable media ID or provider truth is already verified for the existing post, later media-proof drift, changed content rules or readback limitations are non-retroactive. They apply to future generation, not to the already-created provider side effect.

Required behavior:
- preserve the existing media ID and mark `republish_forbidden=true`;
- keep the daily obligation `PUBLISHED`;
- never reclassify a live post to BLOCKED solely because a later exact-media gate would reject the same asset today;
- never create a replacement for the same daily claim;
- use stricter Mira/media rules only before the next provider write.


## Canonical Mira identity — 29 september 2026
Fingerprint: `instagram-canonical-mira-identity-v1`.

Mira is een fictief Bedrijfsgeheugen-personage. Een persoonlijke upload/foto van de gebruiker mag nooit als Mira-reference worden gebruikt.

Canoniek:
- OpenArt fictional Mira master reference id: `Yjqu4D7v76HABNPmQPj1`;
- iedere nieuwe Mira Reel moet in het media-job `identity_reference_id=Yjqu4D7v76HABNPmQPj1` bewijzen;
- user-upload ids `Jt5SWKRgyK3heTqEXH4w`, `w4HhwCmX5GxL8jTGljxe`, `umWzAKt6YBeoVpHlKTtK` zijn expliciet verboden voor Mira;
- ontbreken of afwijken van deze proof blokkeert de job vóór `VERIFYING`;
- user photos/video mogen alleen worden gebruikt voor user-identity content wanneer de gebruiker dat expliciet vraagt; nooit als fallback voor Mira.


## Live Instagram provider identity — 29 september 2026
Fingerprint: `instagram-canonical-provider-identity-v3`.
- Canonieke username: `bedrijfsgeheugen.nl`.
- `INSTAGRAM_GET_USER_INFO(me)` levert twee verschillende identifiers: provider/connection node `id` en Instagram Graph publication `user_id`; de laatst waargenomen waarden staan alleen als evidence in Brain/System Map.
- `id` en `user_id` zijn nooit uitwisselbaar; Graph `user_id` is de publication identity.
- Vóór provider-write: lees `id,user_id,username,name,account_type`; eis een niet-lege Graph `user_id`, username `bedrijfsgeheugen.nl` en BUSINESS/CREATOR. Gebruik exact die live `user_id` voor create → publish → readback.
- Gebruik dezelfde selected canonical connection voor identity-check → create → publish → readback.
- Bij drift: hervat dezelfde ongepubliceerde claim; maak geen replacement post.
- Live closure: media-id `18105956765257858`, permalink `https://www.instagram.com/reel/Dd4MOdTEarq/`, `republish_forbidden=true`.

## Terminal live closure — 29 september 2026
Fingerprint: `instagram-live-proven-20260929-v1`.
- Provider publication is authoritative once provider ack + readback are proven.
- Internal media-job state must converge to `LIVE_PROVEN`; it may not remain `REPLACEMENT_REQUIRED` after a verified provider side effect.
- Current canonical evidence: @bedrijfsgeheugen.nl, BUSINESS, provider user id `28537384955950341`, post id `18105956765257858`, permalink `https://www.instagram.com/reel/Dd4MOdTEarq/`.
- Exact final media SHA-256: `1624616152e89468579fd110db7e68d1900b39bb0309db40acffc7b95000dfa7`; identity confidence 0.93; continuity confidence 0.93.
- After LIVE_PROVEN only outcome collection/learning is allowed; republish/replacement is forbidden for the same daily claim.


## Mira public complaint/source closed loop (2026-09-29)

Fingerprint: `powerhouse-mira-public-complaint-source-loop-v1`.

The canonical upstream for Mira topic selection is public human-problem evidence, not a static content calendar. The loop is:

`public blogs/forums/consumer complaints -> powerhouse_mira_problem_signals_v1 -> scored/deduped private-life problem -> powerhouse_content_recommendations -> immutable powerhouse_instagram_daily_winners_v1 -> OpenArt Mira Reel -> central publisher -> provider readback -> social_posts/social_metric_snapshots -> powerhouse_mira_problem_lineage_v1 -> next ranking`.

Hard rules:
- Mira stays private/daily-life/human; no forced Bedrijfsgeheugen business bridge or office attribution.
- Fresh eligible source-backed recommendations rank before static calendar seeds. Calendar seeds are fallback only.
- Public source evidence must be traceable through source URL/hash, topic, score, recommendation and winner IDs.
- The same source or topic is blocked for 45 days in this loop.
- Once a daily winner exists it remains immutable; provider/media recovery must reuse it.
- Social outcomes and learning write back to the exact source/recommendation/winner lineage.
- Provider search fallback is bounded Tavily -> DataForSEO; no Make.


## Mira ondernemingsprobleem → portal caption, harde publicatiepoort (2026-10-09)

Fingerprint: `mira-entrepreneur-problem-to-portal-caption-v1`. Deze recente expliciete opdracht heeft voorrang op de oudere private-consumer-complaint only-regel. Mira blijft een openlijk fictief, herkenbaar mens in een gewone scène; haar caption gaat nu over één **bestaand canoniek PH-Pxxx ondernemersprobleem**, niet een willekeurige consumentenklacht.

Elke Mira-publicatie bestaat uit exact één passende, origineel geverifieerde Mira-visual/Reel én één volledige Nederlandstalige caption: herkenbare concrete scène → aantoonbare oorzaak of probleemhypothese → **potentieel** zakelijk gevolg → relevante Bedrijfsgeheugen-portaalpagina met capaciteit en voorgestelde actie/eigenaar → te volgen resultaat/meetpunt + begrijpelijke pointe. De caption vermeldt dat Mira fictief is; geen verzonnen klantervaring, geldbedrag of bewezen live-portaalfunctie. De bestaande `config/powerhouse-problem-library.json` is de enige canonieke probleemtaxonomie; ondersteunende externe signalen zijn context, nooit ongetoetst feit.

De bestaande content-orchestrator produceert de source-bound caption, de bestaande Instagram-media-router retourneert de PH-P-scène aan OpenArt en weigert media zonder die lineage, en de bestaande social-publisher voert de machinecheck uit vóór elke provider-side-effect. De bron/portal/scene moeten overeenkomen. Geen extra executor, scheduler, Buffer/Make fallback of tweede taxonomie. De bevroren dagwinnaar wordt niet herschreven; ongeschikte bestaande assets worden niet 'goed' verklaard.

Canonical runtime: `supabase/functions/_shared/mira-entrepreneur-caption.mjs` en test `tests/brain-mira-entrepreneur-caption-v1.test.mjs`. Succes vraagt nog steeds exacte provider-ID, permalink, readback en outcome-evidence.

## Immutable fictional Mira face — same person in every episode (2026-10-09)

Fingerprint: `mira-master-two-image-face-continuity-v1`. The sole canonical fictional OpenArt master is `Yjqu4D7v76HABNPmQPj1`, at `config/instagram-canonical-mira-identity-v1.json`. Original pixels (not text prompts) are authoritative. The same source image is required as the actual OpenArt `image2video` reference for new Reels. Do not select a different stock woman, regenerated master, user photo or unrelated uploaded reference.

After generating, compare exact final media (or each start/middle/end frame in an MP4) alongside the original Mira master using the existing approved vision verifier. Approve only if `face_identity_match=true`, confidence >=0.94, and all three Reel frames match the same canonical SHA; face/age/hairline/identity must not drift. Clothes, gestures, setting and expression may vary. If the comparison is uncertain, hold rather than post. All original exact-media, PH-P entrepreneur problem, full caption, scene-match, dedupe, provider-ack and independent permalink-readback checks remain mandatory.

Canonical code: `supabase/functions/_shared/mira-canonical-face.mjs`. Regressions: `tests/brain-mira-canonical-face-consistency-v1.test.mjs`. No new scheduler, publisher, CRM, or alternate Instagram identity.


## Mira image proof provider recovery — 19 October 2026
Fingerprint: `mira-openai-exact-media-verification-20261019`.
The existing image/temporal verifiers use the governance-approved OpenAI Responses route and OPENAI_API_KEY. Provider changes never alter identity confidence, frame continuity, dimensions, source references, exact hashes or publisher capability gates. Incomplete output, refusal, schema mismatch and provider errors fail closed. Preserve the generated OpenArt history/resource/URL in the same media job; retry verification of those bytes rather than generating another video. A provider outage is not evidence that the face differs. Both vision stages must migrate together; governance remains scoped to the fictional Mira use case. Never deploy Edge source outside protected main and its Supabase Integration.


## Production registration and proof scope
Fingerprint: `mira-production-stage-registration-20261019`.
The router, image verifier and temporal verifier must all be explicitly enabled in supabase/config.toml before protected-main provider delivery can attest this chain. An attestation for other functions never proves Mira source parity. Shared-helper changes must retain explicitly edited undeclared slugs in the resolved scope so the existing registration guard rejects them; never silently drop the very function being repaired. Require exact function inventory/source parity plus a genuine same-video proof request after promotion.


## Producer claim preservation under readiness polling

Fingerprint: `mira-media-preflight-preserve-worker-cas-v1`.

A CLAIMED/GENERATING media job legitimately has no final URL while the external provider runs. Readiness/preflight must preserve its owner/history and never reset it to WAITING_ASSET. All other existing-job projections require exact id+updated_at CAS; if state changed, reread before touching obligation evidence. Concurrent first insert is a typed retry. Completion remains owner-bound and proof remains verifier-owned. Never generate a duplicate because a poll lost a worker claim.

## 2026-10-22 — daily builder recovery and media-poll no-spin

Fingerprint: `powerhouse|daily-social-builder-reopen-media-preflight|20261022-v1`.

A blocked personal LinkedIn `PERSONAL_SOURCE_UNVERIFIED` claim may be
reconsidered by the EXISTING content-loop only when its identity evidence
contains a verified AI-native builder event and the decision has no provider
side effect, consumed publication authority, or republish prohibition.
The content orchestrator must use its full `validPersonalSource` contract
for ALL accepted personal modes: verified personal-life, observation, and
verified founder-builder evidence. Reconsideration never bypasses fresh
copy/source validation, global uniqueness, OAuth, independent prepublish review
or provider receipts.

For Instagram, `WAITING_ASSET` means asset generation has NOT occurred.
A readiness/preflight check must not increment a provider-attempt counter or
rewrite identical business state. Real worker submissions, asset verification
and actual provider proof may increment their own attempts; a media router
cannot manufacture an OpenArt asset or a Mira identity result. Continue
other approved lanes when this media proof is missing. No second scheduler,
no Buffer/Make fallback and no duplicate posting.


## 2026-10-22 — Netlify Mira video-frame authorization must fail closed
Fingerprint `powerhouse|instagram-frame-extractor-auth-oracle-fail-open|20261022-v1`: Original Supabase verifier checks the existing scheduler token BEFORE answering 400/INVALID_INPUT for the purposely blank POST. Treat only HTTP 400 JSON ok=false/error=INVALID_INPUT as proof of a valid caller. Deny 401/403/404/429/5xx/200, malformed JSON and network errors; never trust status!=401. Keep existing OpenArt video allowlist, strict master-face 0.94 and temporal proof. No new scheduler or sender.
