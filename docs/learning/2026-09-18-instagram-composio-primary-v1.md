# Instagram Composio primary delivery v1

Date: 2026-09-18
Fingerprint: instagram-composio-primary-v1

## Decision
Make is no longer a valid Powerhouse dependency. Instagram publishing uses Composio as the primary write transport. Buffer may remain a bounded secondary fallback where explicitly allowed; Make is forbidden.

## Runtime contract
The canonical social publisher:
1. reuses the already approved exact-final-media proof;
2. executes Composio Instagram media creation;
3. publishes that media container;
4. reads the published Instagram media back;
5. writes external_id/permalink only when provider readback matches;
6. never regenerates media merely because transport is unavailable.

## Authentication
Runtime secrets are `COMPOSIO_API_KEY` and `COMPOSIO_INSTAGRAM_CONNECTED_ACCOUNT_ID`. Missing credentials fail closed as `COMPOSIO_INSTAGRAM_AUTH_REQUIRED`; this is an authorization/configuration state, not a reason to route through Make.

## Evidence
Composio Instagram supports Business/Creator accounts and exposes `INSTAGRAM_POST_IG_USER_MEDIA`, `INSTAGRAM_POST_IG_USER_MEDIA_PUBLISH` and `INSTAGRAM_GET_IG_MEDIA`. Composio v3.1 tool execution uses the project API key and connected account id.
