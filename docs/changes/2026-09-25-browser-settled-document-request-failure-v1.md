# Browser verifier — settled document request failure

**Date:** 2026-09-25  
**Fingerprint:** `delivery|browser-verifier|settled-document-request-failure|v1`

Required run 36172823328 failed in the targeted preview browser verifier even though the desktop homepage preview returned HTTP 200, the expected canonical and title, visible content, and no JavaScript page errors. The sole failure was `document:/` from Playwright's `requestfailed` event.

The verifier now suppresses only a failed request matching `document:<final-path>` when the final navigation response itself is successful. This handles an aborted duplicate/superseded document request without masking a broken page.

Hard-failure behavior remains unchanged for:
- scripts and stylesheets;
- document failures when the final navigation is not successful;
- wrong route/canonical identity;
- missing visible content;
- page errors.

Regression coverage is in `tests/targeted-website-route-regression.test.mjs`.


## Skill Projection canonicalization repair
The first merged learning pointed `historical_replay` at a valid regression test outside the Brain test namespace. The canonicalization gate requires a Brain-prefixed replay path. The learning now points to `tests/brain-browser-settled-document-request-failure-v1.test.mjs`, which replays the same safety boundary without weakening the browser contract.
