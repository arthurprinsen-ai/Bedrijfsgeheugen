# LinkedIn company fresh organization OAuth terminal closure

Date: 2026-10-06  
Obligation: linkedin-company-fresh-org-oauth-terminal-20261006

## Problem

Production contains a durable verified fresh organization-OAuth proof for the canonical LinkedIn company account, but the setup controller could still prioritize stale candidate-state. That made a healthy fresh OAuth lineage lose to an older candidate and kept the company claim resumable instead of publishable.

## Structural fix

- read the durable `linkedin-company-oauth-fresh-proof-v1` record;
- treat it as authoritative only when `verified=true` and `fresh_oauth_verified=true`;
- evaluate the exact proven connected account before stale candidate/alias/default discovery;
- verify live ADMINISTRATOR access for the canonical organization;
- require organization write/read scopes on that same OAuth lineage;
- keep provider side effects exclusively in `powerhouse-social-publisher`;
- keep LinkedIn company `PUBLISHED` non-terminal;
- require provider create plus exact LinkedIn readback before `LIVE_PROVEN`;
- keep auth/scope failures resumable on the same daily claim with no replacement post and no Buffer/Make fallback.

## Safety

Already-applied production SQL remains non-executable evidence under `docs/production-sql-history/`. This candidate does not replay production migrations or weaken any publication gate.
