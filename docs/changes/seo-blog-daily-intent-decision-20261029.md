# Daily SEO blog intent admission — 29 October 2026

This change reinforces the existing Powerhouse SEO Opportunity Resolver and its original, protected blog publisher. It does not introduce any scheduler, recipient, blog writer, CMS, public draft, payment, or external provider action.

## Runtime decision
- Start with the existing Google Search Console query evidence and fresh Dutch DataForSEO cache; do not interpret a no-results lookup as absence of market demand.
- Resolve existing canonical money-page ownership before proposing an additional article. Brand-family aliases such as a provider API query remain with the corresponding integration money page unless the canonical SEO map explicitly defines a distinct owner.
- Use the private canonical publication registry only to suppress semantically repeated or pending article intents; no generated article text or draft metadata is exported.
- Require current (14-day) market evidence, commercial fit, and actual first-party impressions or dated independent external evidence with trust >= 0.6.
- At most one new candidate per natural resolver day. A candidate is still PRIVATE and never grants public publication permission.
- Preserve existing code-level authorization, protected merge, blog approval and P0 egress boundary.

## Verification
The source-level Node regression `tests/brain-seo-blog-daily-decision-20261029.test.mjs` covers canonical owner precedence, abbreviated product aliases, pending-topic deduplication, unrelated terms, stale sources and independent evidence. Existing resolver tests and exact-head BRAIN/Required/CodeQL must pass before protected release.

## Outcome contract
The current output is a development candidate, **not production**. Only a protected source merge, authorized Supabase Edge deployment, production readback and independent public URL/CTA/indexability verification can close implementation. Search impressions, organic visits, qualified leads, won orders and realized revenue must be measured from independent sources over 24 hours, 7 days and 30 days; no automatic impact is assumed.

Security incident #5072 remains an independent P0 release gate. Nothing in this change enables public draft publication.
