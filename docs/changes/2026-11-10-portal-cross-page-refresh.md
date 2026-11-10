# P0 #4215 — all native pages react to new authenticated data without losing drafts

## Verified source gaps
- The existing Powerhouse bridge fetches canonical tenant runtime every 45 seconds. It updates the domain read model and publishes an event even for unchanged evidence, but the original mounted native page does not observe changed runtime. Dashboard and other open page views may diverge until navigation.
- A partial Brain ACK for an older edit previously remounted an affected native page even when the customer had since typed a new, unsaved legacy form value.
- An existing identity-boundary event did not explicitly close the old tenant's open page shell.

## Contained source changes
- Deduplicate semantically identical runtime evidence; dispatch the existing event on changed authenticated readback only.
- Original page shell listens to that event, authenticated source refresh and exact causal BRAIN acknowledgements, coalesces a single repaint and checks the same tenant/route at request and animation time.
- Read-only pages update in place; any form with edit controls is preserved and the visible status says to finish and reopen. Identity-boundary closes the old page immediately. No new scheduler, store, API, cron or provider.
- New regression loops every registered page, cross-account swap, dirty state, partial ACK source, 45-second identical and changed runtime.

## Status and proof
This is source-level remediation only until protected Required + CodeQL, source-exact Netlify production deploy and independent authenticated tenant A/B input→Brain→Powerhouse→Heartbeat→advice→outcome→learning acceptance. Browser restart durability and full external connector writebacks remain EVIDENCE_DUE under original #4215. A successful source test is not verified business outcome.
