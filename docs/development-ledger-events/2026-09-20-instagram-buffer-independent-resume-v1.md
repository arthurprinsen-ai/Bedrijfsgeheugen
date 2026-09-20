# Development ledger — instagram-buffer-independent-resume-v1

- Date: 2026-09-20
- Failure: Buffer was read before canonical Instagram dispatch.
- Effect: Buffer 429 could block automatic Instagram resume after Composio OAuth.
- Fix: canonical publisher first; Buffer lane second and isolated.
- Schedule: existing Netlify social-publication-delivery remains hourly at minute 5 and only runs on published deploys.
