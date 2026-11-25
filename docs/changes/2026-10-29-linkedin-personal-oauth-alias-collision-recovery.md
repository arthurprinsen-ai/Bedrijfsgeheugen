# LinkedIn personal OAuth: reserved canonical alias (29 October 2026)

## Context and cause
Original scope repair [PR #5159](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5159) was merged and is ACTIVE in the original Supabase setup Edge runtime v484. Its personal member OAuth requests precisely `openid,profile,email,w_member_social`; LinkedIn's unavailable `r_member_social` is no longer requested. The earlier owner link expired. One new owner-bound production attempt through original `powerhouse-composio-linkedin-setup`, `pg_net #16109` (29 October 2026), failed with HTTP 503, upstream 400: `Alias "bedrijfsgeheugen-personal-canonical" is already in use by another connection for this entity`.

**Root cause:** An earlier (possibly expired) pending connection continues to reserve the fixed alias even though a new owner OAuth link is needed. Blindly repeating the same request fails, as does reusing old auth configs with closed scopes.

## Bounded change in original owner
Recover only the exact Composio alias-already-used response, and only during `create_personal_link`. On initial alias collision, retry once with a unique pending `bedrijfsgeheugen-personal-canonical-reauth-<randomUUID>` alias, keeping original `bedrijfsgeheugen-owner` identity and exact four-scopes auth config. Fail closed on other errors, including rejected scopes, missing credentials, missing identity, or failed provider consent. Do not delete/replace old accounts. Return candidate metadata and one-time URL only to the authenticated caller. No additional scheduler, router, or sender.

## Independent observations and acceptance
- Original Supabase edge runtime v484 ACTIVE before this change; PR #5159 protected merge verified.
- `pg_net #16109` was one unsuccessful canonical link request; no second link created by that attempt.
- Existing personal post for 2026-10-29 has provider ID `urn:li:share:7521667096859201536`, status `PUBLISHED` with `live_proven_at=NULL`, `verification_pending=true`, and `republish_forbidden=true`.
- Independent `LINKEDIN_GET_POST_CONTENT` on a separately connected plugin account returned HTTP 403; this cannot be used as positive proof of the canonical publisher. Original readback is also permission-limited. NEVER republish to check the token, and never declare LIVE_PROVEN without genuine independent verification.
- **Release criteria:** protected Required/BRAIN/CodeQL and merge; exact original Supabase Edge deploy and source readback; exactly one fresh original link returns 200 `PERSONAL_AUTH_LINK_READY` with safe scopes and `alias_collision_recovered=true`; owner grants OAuth consent; canonical personal identity preflight succeeds. Existing PUBLISHED post needs independent readback or must stay pending. Seven-day regression remains open until observed.

Owner: canonical Powerhouse LinkedIn setup; parent invariant [#4439](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4439). This is not a closed-loop revenue or publishing success claim.
