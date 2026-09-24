# 2026-09-24 — LinkedIn daily self-healing

Fingerprint: `linkedin|daily-publish|measured-link|provider-side-effect-dedupe|self-healing|v1`

- Observed: company publication blocked on missing measurable `/g/` CTA before provider create.
- Recovered same lineage: created `li-company-20260924`, rewrote the exact artifact, reran the existing publisher, provider returned `urn:li:share:7508804000113131521`.
- Containment: `republish_forbidden=true`; no replacement company post can be created for the same day.
- Code prevention: publisher now provisions the daily campaign link before review.
- Capability prevention: LinkedIn setup distinguishes publish vs readback scopes.
- Runtime prevention: existing LinkedIn recurring task converted to hourly recovery/watch semantics; existing daily kickoff remains initial owner.
- Verification contract: `tests/brain-linkedin-daily-self-healing.test.mjs`.
