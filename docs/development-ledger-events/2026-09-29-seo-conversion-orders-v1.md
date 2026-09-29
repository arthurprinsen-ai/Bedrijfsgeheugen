# Development ledger — seo-conversion-orders-v1

Date: 2026-09-29
Obligation: seo-conversion-orders-v1
Lane: website
Candidate: promotion

Observed:
- Technical SEO baseline is strong.
- Commercial ranking visibility remains the material constraint.
- Canonical SEO Growth Intelligence and SEO Order Engine already existed and are reused.

Implemented:
- conversion/order-weighted SEO objective;
- CRO model set and bounded autonomous action rules;
- process-automation money-page message/CTA/risk-reversal improvements;
- homepage structured-data alignment;
- daily SEO automation prompt upgraded to the same canonical rules.

Verification required:
- SEO growth tests;
- SEO order tests;
- site/SEO controls;
- protected merge;
- exact production readback;
- downstream conversion/outcome learning.

Learning state: TESTING until observed outcomes justify promotion.


Skill/system-map closure:
- .agents/skills/powerhouse-seo-conversion-orders/SKILL.md
- .agents/skills/powerhouse-growth-swarm/SKILL.md
- docs/brain/component-registry.json -> CAPABILITY_SEO_CONVERSION_ORDERS
- tests/brain-seo-conversion-orders-v1.test.mjs

Borging correction:
- detected documentation/source drift: component registry contained `CAPABILITY_SEO_CONVERSION_ORDERS`, while the canonical system-map source lacked the explicit capability node;
- added `seo-conversion-orders` to `platform/system-map/canonical-system-map.mjs`;
- extended the canonical skill with mandatory system-map/documentation/writeback closure;
- extended Brain learning with system-map/documentation references and prevention rule;
- added regression coverage so this discoverability drift fails tests in future.

Existing-page conversion application:
- unified primary order path on 9 priority commercial pages;
- primary CTA now routes to the free 30-minute Frisse Blik qualification step;
- added explicit no-obligation/risk-reversal copy;
- removed generic-contact-first paths on Exact, API and Power BI priority CTAs;
- corrected inconsistent paid/free Frisse Blik wording;
- removed stale AFAS monitoring price and unsupported trust/security copy;
- added regression test `tests/seo-money-page-order-conversion-v2.test.mjs`.

Money-page conversion wave 2:
- extended the same qualified-order path to Twinfield, AI adoption, Bedrijfsgeheugen and Voor MKB;
- aligned AI-adoption canonical CTA authority with the visible Frisse Blik route;
- expanded conversion regression coverage to all four pages;
- preserved existing-page-first and no-duplicate-intent rules.
