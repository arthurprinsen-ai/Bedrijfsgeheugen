# Powerhouse Brain: LinkedIn provider proof must count as daily commercial output

## Defect and observed business effect
On 8 October 2026 the existing publisher live-proved the company post `urn:li:share:7513894237386719236` under the canonical Bedrijfsgeheugen organization with real LinkedIn create, company-admin OAuth, write scope and exact readback. The blog was also independently live-proven, yet the current Brain output assurance reported only one publication: it required a `canonical_url` field for LinkedIn, despite the immutable provider URN and verified provider acknowledgement.

## Correct single-owner repair
One additive SQL migration replaces **only** `public.powerhouse_commercial_output_assurance_v1(date)`. It accepts existing `LIVE_PROVEN` company LinkedIn provider URNs when all provider and owner proofs are present; draft, queued, unverified, expired/OAuth-invalid or guessed external identifiers still do not count. The blog retains the owned-domain public URL condition. Instagram retains exact final-media and Mira identity checks. The production privilege boundary remains explicitly revoked for public, anon and authenticated callers.

No alternate scheduler, publisher, sender, business-action row, DNS route or fabricated revenue. Preserve one existing Powerhouse Brain and publisher authority.

## Exact evidence
- Existing canonical publisher readback: `urn:li:share:7513894237386719236`; organization `urn:li:organization:18234216`.
- Existing 8 October blog public URL: `https://www.bedrijfsgeheugen.nl/blog/circular-plastics-nl-cpnl-subsidie-40-miljoen-voor-onderzoek-en-showca/`.
- A transactionally rolled-back production-schema verification of the proposed function yielded `provider_proven_publications=2`, `commercial_day_proven=true`, `provider_proven_email=0`. This **does not** mean the migration is deployed.
- Regression: `tests/brain-commercial-social-provider-urn-proof-v1.test.mjs`.

## Delivery policy
Exact-HEAD admission, Required and CodeQL, official Supabase Preview replay, protected merge, migration-version/function-security readback and the next natural five-minute Heartbeat are separate acceptance gates. Any open gate keeps deployment status open. No synthetic status or forced bypass.
