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
