# Instagram Composio primary delivery v1

Date: 2026-09-18
Fingerprint: instagram-composio-primary-v1
Status: runtime contract live; current publication blocked only on missing Composio project authorization.

## Incident

A fully proven Mira Reel reached PROOF_VERIFIED but could not be published. Buffer returned a 24-hour rate limit. A historical Make route was initially considered, but Make is retired and must never be part of active Powerhouse execution. Runtime inspection also showed that no Composio project credential was available in Supabase/Netlify.

## Root causes

1. General toolchain authority still described Buffer as the generic social publisher, while Instagram had evolved to Composio-primary.
2. Instagram publishing needed a first-class Composio transport contract with provider readback.
3. The first runtime implementation used an obsolete Composio v3.1 execute URL.
4. Instagram's review payload temporarily dropped hook_type and was blocked before transport.
5. Composio runtime authorization is currently absent: no COMPOSIO_API_KEY is available.

## Canonical decision

- Make is retired: no execution, orchestration, recovery or fallback.
- Instagram publishing uses Composio as the primary write transport.
- Buffer is only a bounded secondary transport where explicitly authorized.
- A transport outage/rate limit never permits silent fallback to Make.
- Proven media is preserved across transport/auth failures; no regeneration solely for recovery.

## Runtime contract

The canonical publisher:
1. reuses exact-final-media + Mira proof;
2. reruns the pre-publish gate with hook_type preserved;
3. reads COMPOSIO_API_KEY;
4. uses COMPOSIO_INSTAGRAM_CONNECTED_ACCOUNT_ID when configured, otherwise discovers exactly one ACTIVE Instagram connected account;
5. creates media via INSTAGRAM_POST_IG_USER_MEDIA;
6. publishes via INSTAGRAM_POST_IG_USER_MEDIA_PUBLISH;
7. reads back via INSTAGRAM_GET_IG_MEDIA;
8. persists external_id/permalink/PUBLISHED only when provider readback matches.

## Current Composio API contract

Tool execution uses:
`https://backend.composio.dev/api/v3/tools/execute/{tool_slug}`

Do not use the obsolete `/api/v3.1/tools/execute` path and do not force an invented `version=latest`.

## Recoverable auth states

- `COMPOSIO_INSTAGRAM_AUTH_REQUIRED`: no project API key.
- `COMPOSIO_INSTAGRAM_CONNECTION_REQUIRED`: project key exists, no active Instagram account found.
- `COMPOSIO_INSTAGRAM_CONNECTION_AMBIGUOUS`: multiple active accounts and no explicit connected-account id.

All three preserve the proven asset and canonical lineage for replay.

## Evidence observed on 2026-09-18

- Exact OpenArt Reel passed start/middle/end Mira vision proof.
- Pre-publish gate passed after hook_type projection was fixed.
- Composio-primary publisher was deployed to Supabase.
- Current runtime terminates at `COMPOSIO_INSTAGRAM_AUTH_REQUIRED`.
- Make dependency is stored as false in canonical delivery evidence.
- No external_id is written until provider readback succeeds.

## Prevention

Every chat/agent must resolve Instagram delivery through the dedicated `instagram-composio-publisher` skill plus the global `powerhouse-toolchain-authority` skill before proposing or executing recovery. Any new active Make reference is a regression. Any claim of LIVE without Instagram/provider readback is a truth defect.
