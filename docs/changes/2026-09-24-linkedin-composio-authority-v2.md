# LinkedIn publishing: Composio is the authority

## Change

LinkedIn publication is no longer dependent on Buffer. Personal LinkedIn continues through Composio and LinkedIn company now has its own Composio publish path.

## Root cause

The shared social publisher contained an explicit Composio branch for `linkedin_personal`, but no equivalent branch for `linkedin_company`. Company posts therefore fell through to the generic Buffer transport. The Buffer 429 circuit could also mark LinkedIn rows as rate limited.

## Prevention

LinkedIn personal and company must both exit through their Composio branches before any Buffer code is reachable. Provider failures are fail-closed: the exact claim is blocked and may not be republished through another provider. Daily-channel idempotency and publication-capability consumption remain mandatory.

## Evidence and production gate

A LinkedIn claim is `published` only after Composio readback matches the exact post URN, author, commentary and `PUBLISHED` lifecycle state. Company publishing additionally requires exactly one verified LinkedIn organization author URN. If that identity is absent or ambiguous, company publishing remains blocked rather than falling back to Buffer.
