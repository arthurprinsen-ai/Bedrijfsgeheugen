---
name: seo-revenue-growth
description: Use when auditing, prioritizing, creating, updating, consolidating, publishing, measuring, or recovering Bedrijfsgeheugen SEO/content work where search demand must lead to qualified traffic, leads, orders and revenue without cannibalization.
---

# SEO Revenue Growth

Fingerprint: `seo|revenue-growth|intent-owner-first|v1`.

## Authority

Canonical learning remains the authority. This skill is a durable execution projection and must be combined with:
- `site/seo-order-map.json`
- `site/seo-order-expansion.json`
- `config/seo-growth-loop.json`
- `config/seo-search-sources.json`
- `config/content-growth-policy.json`
- `brain/learning/2026-09-19-seo-revenue-intent-owner-first-v1.json`

## Core rule

Search intent has one canonical owner.

If a mapped money or pillar page already owns the intent:
- improve that page first;
- strengthen relevant internal links;
- improve SERP CTR only when ranking is not the primary constraint;
- fix content/evidence/conversion gaps;
- do not create a competing blog or landing page unless a genuinely distinct intent gap is evidenced.

If no canonical owner exists:
- map the query first;
- check cannibalization and adjacency;
- create only the smallest support or money-page candidate justified by evidence.

## Revenue prioritization

Rank opportunities by the strongest available combination of:
- transactional/commercial intent;
- search demand;
- CPC as a commercial-value signal, not a revenue guarantee;
- search trend;
- ranking gap;
- engagement and CTA gap;
- lead and order conversion;
- observed revenue.

Traffic volume alone must never outrank order/revenue evidence.

## Daily opportunity loop

- Reuse Search Console and existing first-party evidence before paid calls.
- Use bounded DataForSEO enrichment only for the highest-value unresolved gaps.
- Return at most five actionable opportunities per daily cycle.
- Prefer the smallest measurable intervention.
- Every candidate needs target query/intent, canonical page, evidence, action, success metric and cannibalization risk.
- A new blog is not the default output.
- Every daily cycle must end in an execution decision, not only a report: `UPDATE_MONEY_PAGE`, `CREATE_INTENT_GAP_CONTENT`, or `NO_ACTION_EVIDENCE_INSUFFICIENT`.
- `CREATE_INTENT_GAP_CONTENT` is allowed only when a distinct query/intent gap is evidenced and no existing canonical owner should absorb it.
- When `CREATE_INTENT_GAP_CONTENT` wins, write the complete article in the same lineage, add useful internal links and a conversion path to the relevant money page / Frisse blik, then send it through candidate PR, required checks, protected merge and production readback.
- Do not use `oldest-approved` or content age as a revenue-selection fallback. If current commercial evidence is unavailable or noisy, fail closed with `NO_ACTION_EVIDENCE_INSUFFICIENT` rather than publish filler.
- When `UPDATE_MONEY_PAGE` wins, improve the canonical owner instead of creating supporting content with materially overlapping intent.
- Persist the decision evidence and subsequent search/CTA/lead/order/revenue outcome so the next cycle can learn from actual commercial results.

## Commercial clarity on money pages

- For decide-stage money pages, expose the verified buying path early: start point, current price/range where canonically published, scope boundary, next step and primary CTA.
- Reuse the canonical pricing source; never invent or independently drift commercial amounts on SEO pages.
- Prefer improving the existing intent owner over creating a support article when the gap is conversion clarity rather than search intent.
- Measure the path from organic landing → primary CTA → scan/lead → order → revenue.

## Cannibalization and consolidation

When two URLs own materially the same intent:
- select one canonical owner based on existing authority, correctness and site architecture;
- remove the duplicate from sitemap, index surfaces and RSS where applicable;
- 301 the duplicate/typo URL to the canonical when URL retirement is appropriate;
- preserve relevant user value on the surviving page;
- add a regression check so the duplicate cannot silently return.

## Internal authority

Internal links must be contextual and useful. Prefer links from semantically related money/support pages. Never add arbitrary links purely to increase counts.

## Delivery

Use only canonical PR delivery lanes from `config/powerhouse-delivery-hygiene-v1.json`. SEO domain labels are not delivery-lane values.

Do not claim LIVE & BEWEZEN at PR, merge, deploy-start or stale public readback. Terminal proof requires current-main containment, exact production deploy identity and public behavior readback.

## Cost and sustainability

Reuse/caching/dedupe first. Avoid broad paid keyword expansion when a bounded Search Console or DataForSEO query can answer the decision. Do not rerun healthy exact-head CI or issue duplicate builds just to refresh status.
