# Evidence-expiry fail-closed Trust Center

A cached snapshot can contain historical `PASS` observations even after `expires_at`. Enforce UTC timestamp validity at **render time**: observations must have observed_at, expires_at and valid date ordering; snapshot generatedAt must be at most 24 hours old. An expired or missing proof is never green. Source failures remain red and require action.

This is a localized read-model correction on the existing authenticated `portal-v2` Security Trust Center. It neither changes auth nor creates another agent, scanner, scheduler or source of security truth. Raws remain server-side.

Regression: existing Portal trust tests and Brain security trust historical/shadow/canary; generator/System Map integrity, Required, CodeQL, protected merge, exact Netlify production and authenticated portal readback are still mandatory.
