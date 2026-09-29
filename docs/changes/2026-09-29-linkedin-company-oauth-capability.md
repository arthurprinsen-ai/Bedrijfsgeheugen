# LinkedIn company OAuth capability repair — 2026-09-29

## Incident
The Bedrijfsgeheugen company publisher had multiple Composio LinkedIn connections that were labelled ACTIVE while LinkedIn itself returned 401 `REVOKED_ACCESS_TOKEN`. After a normal reconnect, personal profile reads succeeded but organization ACL reads still returned 403 because the reconnect used an auth configuration without organization scopes.

## Root cause
Two independent health dimensions were conflated:
1. connection/token health;
2. organization-scope health.

Composio connection status was treated as stronger evidence than the live LinkedIn provider response. Reconnect also reused a default/personal OAuth configuration, so the new token did not restore organization capability.

## Permanent rule
Company publishing for `urn:li:organization:18234216` is allowed only when the exact connected account proves:
- live member identity;
- no revoked provider token;
- live organization ACL capability;
- organization write capability.

`ACTIVE` alone is never sufficient. A reconnect that fixes personal reads but still fails organization ACL is `SCOPE_DEFICIENT` and cannot become canonical.

## Recovery behavior
- Quarantine revoked or scope-deficient company connections.
- Keep one capability-proven canonical company writer.
- Never fall back to personal LinkedIn, Buffer or Make.
- Preserve the same daily publication claim and unique-content reservation across reauthorization.
- If a connector cannot autonomously create/select the required organization auth config, request only the smallest unavoidable human OAuth/auth-config action and then resume the same lineage.

Canonical fingerprint: `linkedin-company-scope-aware-reconnect-v1`.
