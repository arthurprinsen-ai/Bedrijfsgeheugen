# Browser evidence: benign aborted document navigation

Date: 2026-09-25  
Fingerprint: `website|browser-evidence|benign-aborted-document-navigation|v1`

A targeted preview check reported `failedAssets: ["document:/"]` on desktop `/` while the route itself returned HTTP 200, rendered visible content and matched canonical route identity.

The verifier previously collapsed every Playwright `requestfailed` document event into a hard failure without retaining the failure reason. The correction keeps the verifier fail-closed but excludes exactly one browser-controlled case: `resourceType=document` with `failure.errorText=net::ERR_ABORTED`. This represents a superseded/cancelled navigation rather than a failed loaded page.

All script and stylesheet failures remain hard failures. Document failures with any other error reason also remain hard failures.
