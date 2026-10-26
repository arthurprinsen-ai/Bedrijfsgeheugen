# Delivery event — retire duplicate Buffer social writer

- Date: 2026-10-15
- Obligation-ID: netlify-legacy-social-writer-retirement-20261015
- Root evidence: Netlify request logs 2026-10-15 16:10 UTC; social-publication-delivery and deploy variants returned HTTP 502 due missing `config/social-channel-identity-contract.json` in function package.
- Decision: do not resurrect Buffer or a parallel sender. Canonical Supabase `powerhouse-social-publisher` already functions independently.
- Change: replace 10-minute scheduled legacy Netlify sender with nonpublishing 410 compatibility surface; make deployment hook a no-op. No provider writes.
- Regression: `tests/brain-retire-netlify-buffer-social-sender.test.mjs`.
- Scope: only two Netlify functions, one test, and the three canonical evidence artifacts.
- Proof boundary: protected CI, merge, ready production deploy and exact readback required; no claims of Instagram/email delivery or removal of provider authorization gates.
