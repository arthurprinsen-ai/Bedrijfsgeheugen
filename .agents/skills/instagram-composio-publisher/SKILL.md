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
