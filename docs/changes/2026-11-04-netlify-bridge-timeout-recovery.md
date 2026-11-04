# Deployment timeout correction

The original Production Source Snapshot deployment waited only 20 seconds for the authorized Supabase Netlify bridge. Provider logs prove OIDC verification, correct Netlify site and proxy readiness at 25.166 seconds, after the GitHub client had already timed out. This produced a misleading bridge_unavailable error.

The existing workflow now waits up to 60 seconds for this specific request. No additional deployment owner, scheduler, fallback publisher, permission bypass or unverified green state is introduced.

Acceptance: required GitHub checks pass; merge into protected main; the original owner publishes the exact source SHA; independent Netlify release.json and Portal V2 mobile DOM checks succeed. Until then status is pending.
