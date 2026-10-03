# Deploy-preview visibility retry recovery — 2026-10-03

Obligation: `deploy-preview-visibility-retry-20261003-v1`

Observed:
- PR #3629 browser verification passed route identity and most visibility checks;
- a single `/en/wijzigingen` tablet request on the Netlify deploy-preview returned HTTP 403;
- the same preview served surrounding routes successfully;
- the incident repeated after unrelated homepage-toggle flakiness had already been removed.

Closure:
- retry policy extracted into a testable helper;
- deploy-previews receive five bounded attempts with increasing backoff;
- production remains on three attempts;
- persistent failures still fail closed;
- executable replay verifies both policies.
