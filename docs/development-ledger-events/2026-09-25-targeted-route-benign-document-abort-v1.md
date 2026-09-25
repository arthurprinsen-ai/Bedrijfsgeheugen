# Development ledger — targeted route benign document abort v1

- Date: 2026-09-25
- Failure: targeted browser verification red on `document:/` while HTTP/canonical/visible-content checks were green.
- Root cause: Playwright `requestfailed` reason was discarded.
- Fix: ignore only `document + net::ERR_ABORTED`; keep every other document/script/stylesheet failure hard.
- Regression: `tests/brain-targeted-route-benign-document-abort-v1.test.mjs` and `tests/targeted-website-route-regression.test.mjs`.
- Fingerprint: `website|browser-evidence|benign-aborted-document-navigation|v1`.
