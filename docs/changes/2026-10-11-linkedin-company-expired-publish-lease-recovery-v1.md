# P0 #4198 — recover an expired LinkedIn company publishing authority without duplicate posting

## Verified production failure on 11 October 2026
The existing `powerhouse-social-publisher` received `DAILY_CHANNEL_PUBLICATION_ALREADY_CLAIMED`: three authority leases had expired without ever being consumed. The last remained non-revoked. The company decision was `blocked`, the company publication obligation had no external ID or provider acknowledgement and no published uniqueness reservation existed. The built-in capability expiry cleanup could not run because it requires the decision to have already reached `dispatching`.

## Narrow repair
The existing publisher attempts to restore **only the original company's same-day claim** before selecting publishable decisions. Both canonical decision and obligation must explicitly prove zero provider side effects, no provider ID, no current/consumed lease and no uniqueness reservation. The publisher conditionally revokes only expired, unconsumed leases and changes that exact original decision back to `content_ready` with timestamp CAS. All normal content quality, pre-publish, authorization, global uniqueness, issuer, Composio and provider proof gates still apply. Nothing automatically retries a potentially delivered or ambiguous post.

This creates no parallel scheduler, no alternate provider transport, no replacement content, and no new daily claim. The matching pure guard is regression tested, including forbidden cases for consumed/active lease, side-effect, missing proof, duplicate reservation, wrong date and wrong channel.

## Production evidence and acceptance
A one-time guarded Supabase update revoked one expired, unconsumed company capability and restored the original 2026-10-11 decision to `content_ready`. This is not a company publication and not an externally verified live post. The authorized publisher invocation could not be completed from this environment. PR #4339 contains the code candidate. Require protected Required, CodeQL and provider Supabase deploy parity, followed by actual automatic recovery evidence and exact provider acknowledgement/readback before promoting this lane or closing #4198. Never republish the independently recorded personal LinkedIn post (`urn:li:share:7514994526516838400`).
