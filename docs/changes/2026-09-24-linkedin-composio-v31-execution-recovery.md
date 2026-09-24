# LinkedIn company publishing — Composio v3.1 recovery

## Problem
LinkedIn organization publishing was blocked by two independent issues: missing organization OAuth scopes and an outdated Composio execution payload in the publisher.

## Verified external configuration
The active LinkedIn connection now has `openid`, `profile`, `email`, `w_member_social`, `r_organization_admin`, and `w_organization_social`. Composio resolves exactly one company author: `urn:li:organization:18234216`.

## Implementation change
PR #2697 changes LinkedIn execution to structured Composio v3.1 arguments with the canonical connected `user_id`. It also contains post-create readback containment for company posts.

## Safety semantics
When LinkedIn CREATE returns a real post URN:
- the provider side effect is considered to have occurred;
- the daily claim becomes non-repeatable;
- `republish_forbidden=true`;
- a failed exact readback results in `DISPATCHED` / `verification_pending`;
- no fallback or replacement post is allowed.

Only exact provider readback can promote the claim to `PUBLISHED` / `LIVE_PROVEN`.

## Root-cause fingerprint
`linkedin|composio-v31|structured-arguments|post-create-readback-containment|v1`
