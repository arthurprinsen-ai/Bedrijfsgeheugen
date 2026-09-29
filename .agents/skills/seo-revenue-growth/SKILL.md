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

## Opportunity intelligence and first-mover forecasting

- Before declaring CPC, search volume or ranking evidence unavailable, read the canonical resolver chain in order: fresh GSC, valid DataForSEO cache, active external market forecasts, then only a bounded paid live lookup for unresolved high-value gaps.
- A healthy zero-item DataForSEO heartbeat proves producer liveness, not absence of market demand. It must never erase still-valid cached keyword evidence.
- Fuse search evidence with Powerhouse market forecasts and persist a pre-outcome forecast before autonomous action. Forecast/CPC signals prioritize work but never count as realized revenue.
- Optimize for first-mover capture: detect accelerating Dutch queries early and calculate a bounded first-mover opportunity score from demand, CPC, ranking gap, GSC evidence, whitespace and external forecast evidence.
- Canonical intent ownership remains the hard gate. Existing owner => `UPDATE_MONEY_PAGE`; distinct evidenced gap => `CREATE_INTENT_GAP_CONTENT`; insufficient evidence => `NO_ACTION_EVIDENCE_INSUFFICIENT`.
- Only a `CREATE_INTENT_GAP_CONTENT` decision may enter `powerhouse_content_recommendations` for the blog channel. Reuse the existing content orchestrator and protected blog publisher; never create a parallel publishing path.
- Every autonomous first-mover publication must preserve query, source freshness, owner check, forecast lineage, CTA target and later GSC/lead/order/revenue outcome for calibration.
- The runtime intent-owner projection must remain test-equal to `site/seo-order-map.json` plus `site/seo-order-expansion.json`.
- Every new SEO runtime function or RPC surface must be registered in the Powerhouse quality-surface registry with a green evidence contract before it can be treated as structurally closed.

## Commercial aliases and shortened brand/product queries

- Treat shortened branded/product queries (for example `exact online api`) as aliases of the existing canonical money page when they express the same commercial job-to-be-done.
- Encode proven aliases in the canonical SEO intent-owner maps first; regenerate the runtime projection from those maps. Do not weaken the global owner-match threshold merely to catch one alias.
- If a production canary creates a `CREATE_INTENT_GAP_CONTENT` recommendation that later proves to have an existing owner, contain it immediately before publication, record the false-negative, repair the canonical map and rerun the resolver.
- First-mover speed never outranks cannibalization prevention or canonical ownership.

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


## Opportunity must execute

Fingerprint: `seo-opportunity-must-execute-v1`.

A daily SEO opportunity is not a deliverable by itself. Never emit an advice-only opportunity to the operator when Powerhouse can safely act on it.

For every commercially relevant opportunity, the same canonical lineage must terminate in exactly one evidenced outcome:
- `EXECUTED`: the smallest justified change was implemented on the canonical intent owner, or distinct intent-gap content was created;
- `REJECTED_WITH_EVIDENCE`: no write is justified because evidence is insufficient, intent is already fully served, expected commercial value is too low, or the action would create cannibalization.

`NO_ACTION_EVIDENCE_INSUFFICIENT` is therefore an internal rejection reason, not the final product output. Persist why it was rejected.

After `EXECUTED`:
- preserve the protected-delivery contract: candidate PR → required gates → protected merge → exact-main production identity → public readback;
- never claim LIVE before production readback;
- derive useful distribution from the executed asset when it can create qualified reach without duplicating intent: Bedrijfsgeheugen LinkedIn company content and the canonical Bedrijfsgeheugen Instagram persona/channel; personal LinkedIn remains outside company-content distribution;
- do not manufacture social posts merely to satisfy volume; distribution must point to the canonical commercial path and remain unique;
- persist query → canonical page → CTA → Frisse blik/scan → lead → offer → order → realized revenue attribution.

The operator-facing daily output is an execution/impact log, not an SEO advice list. Report what was executed, what was rejected and why, delivery/readback state, distribution state, and measured commercial outcomes. Recommendations are allowed only where a human decision is genuinely required.


## Autonomous inspect-then-act

Fingerprint: `seo-autonomous-inspect-then-act-v1`.

Repository inspection is a prerequisite to execution, never a reason to stop. When current commercial evidence is sufficient to justify an SEO action, the agent must autonomously:
1. inspect current `main`, the canonical intent-owner maps, the target page source, current open PRs/obligations and delivery hygiene;
2. reuse or reconcile an existing compatible lineage when one exists; otherwise create exactly one candidate lineage;
3. implement the smallest justified owner-first change;
4. add/update regression evidence and required closure artifacts;
5. send the candidate through the canonical protected-delivery gates;
6. after protected merge, verify exact-main production identity and public behavior before claiming LIVE;
7. persist and later evaluate search → CTA → Frisse blik/scan → lead → offer → order → realized revenue outcomes.

Do not return “I did not create a candidate because repository state/owner/lineage first needed inspection.” Perform that inspection in the same run.

Human input is required only when an unresolved decision genuinely needs operator authority, credentials/authorization are unavailable, safety or legal constraints prohibit autonomous action, or two materially conflicting business choices cannot be resolved from canonical evidence. A transient tool or CI failure is a recovery task, not a reason to convert execution into advice.

If evidence is insufficient after bounded inspection, terminate as `REJECTED_WITH_EVIDENCE` and persist the exact missing evidence. Never fabricate demand, rankings, conversion evidence or a reason to write.


## First paid order revenue invariant

Fingerprint: `first-paid-order-revenue-invariant-v1`.

This skill inherits the One Brain revenue north star. While the canonical commercial state has no evidenced paid order, prioritize the shortest evidence-based path to the first paid order and realized revenue. SEO metrics are diagnostic signals, not terminal success.

For every SEO/content action, identify its role in:
`market problem → qualified prospect/visit → CTA/contact → lead → meeting → proposal → paid order → realized revenue → learning`.

Do not optimize for impressions, rankings, traffic, posts, blogs, leads or pipeline as ends in themselves. Prefer the action that removes the highest-evidence conversion bottleneck. Where a safe executable action exists, execute it under the canonical delivery contract rather than returning advice.

Never autonomously send unsolicited outbound messages. Powerhouse may identify and prepare qualified outreach opportunities, but a human must authorize/send unsolicited prospecting communication unless a separately approved consent-based workflow applies.


## Workshop scan → Powerhouse → portal handoff

Fingerprint: `workshop-scan-powerhouse-handoff-v1`.

Workshop scans are a revenue surface, not a disposable lead form. The canonical chain is:

`attributed workshop URL/QR → consented scan → deterministic score/radar → personal PDF → Powerhouse scan store → portal handoff → account/organisation claim → follow-up → offer → paid order → realized revenue → learning`.

Rules:
- Reuse the canonical `/scan` flow; never create a parallel workshop form for a partner, event or municipality.
- Persist the non-PII scan result to the canonical Powerhouse scan ingest in the same completion action that builds the visible result.
- Preserve `submission_key`, partner/workshop/event and UTM attribution across the scan, PDF and portal handoff.
- Keep personal name/email in the consented lead path only; the aggregate Powerhouse scan event remains no-PII until verified organisation identity claims it.
- Save a browser-local scan package so a participant who opens the portal on the same device starts from the scan as the first nulmeting instead of starting from zero.
- Portal/account handoff is the primary product continuation; pricing remains a commercial choice surface, not a substitute for the portal.
- QR codes inside the personal PDF should continue the participant into the portal and preserve the scan lineage where possible.
- A workshop is commercially incomplete if it only produces a PDF. Measure scan completion → PDF → portal open/account → meeting/offer → paid order.
- Update regression evidence whenever the scan schema, portal mapping, scoring, prices, CTA destinations or ingestion contract changes.


### Workshop scan visual contract

Fingerprint: `workshop-scan-three-surface-design-v1`.

The workshop journey has exactly three visual surfaces:
1. pre-scan workshop handout: QR + promise + explanation; used during the workshop;
2. post-scan result page 1: strength, friction, opportunity, benchmark radar and domain table;
3. post-scan result page 2: top three levers, 90-day roadmap, measurable KPI follow-up and portal CTA.

The generated participant PDF contains surfaces 2 and 3 only. Never insert the handout as page 1 of the participant result. Keep both post-scan pages bound to the same `submission_key` and portal QR lineage. Derived result pages may show questionnaire scores, benchmark gaps and deterministic planning guidance; do not invent quantified savings or improvement percentages that the scan did not measure.


## Growth Swarm integration
SEO is een demand/intent-ingang van `powerhouse-growth-swarm-v1`, niet een los optimalisatiedoel. Zoekvragen, money-page gedrag, problem/switch-page kansen en content outcomes mogen account-/segmentprioriteit verhogen, maar tellen niet zelfstandig als koopintentie. De 20-play catalog bevat `competitor-switch-pages`, `prospect-generated-content-loop`, `we-disagree-content` en `mkb-friction-index`; deze blijven onder canonical intent ownership, cannibalization control en query -> lead -> order -> realized revenue attributie.


## €1M Revenue Operating Contract — 29 september 2026
Fingerprint: `powerhouse-one-million-revenue-operating-contract-v1`.

Deze skill erft verplicht `config/powerhouse-one-million-revenue-operating-contract-v1.json`.

Niet-onderhandelbaar:
- North star: €1.000.000 gerealiseerde omzet binnen 365 dagen; paid order en realized revenue wegen altijd zwaarder dan bereik, traffic, posts, scans, leads of meetings.
- Elke dagelijkse commerciële run kiest uit één gedeelde next-best-action ruimte: bedrijfspost, Mira-Instagram, SEO/blog/CRO, contextuele LinkedIn-reactie, warm/consented e-mail, ondersteunde private follow-up, due follow-up, offerte/offer follow-up, warme referral, partner/workshop follow-up of value asset.
- Een gekwalificeerde veilig uitvoerbare actie wordt uitgevoerd; alleen aanbevelen/draften is niet terminal wanneer de canonieke executor beschikbaar is.
- Achterstand op omzetpace verhoogt kwaliteit en aantal gekwalificeerde research/value/follow-up-acties, maar omzeilt nooit evidence, identity, privacy, consent, suppression, dedupe, fatigue of provider-ack gates.
- Generieke cold-bulk autosend blijft verboden. Koude prospects mogen automatisch worden gevonden, verrijkt, gescoord en voorbereid; extern verzenden gebeurt alleen binnen een afzonderlijk goedgekeurde lawful/consent-based eligibility route.
- Warm/consented outreach, bestaande relatie/opportunity follow-up, due follow-up en bestaande klant-/partnercontext mogen autonoom worden uitgevoerd wanneer de bestaande gates groen zijn.
- LinkedIn persoonlijk blijft personal-life-only; commercieel air-cover hoort op de Bedrijfsgeheugen-bedrijfspagina. Instagram blijft Mira-only.
- Iedere kanaalactie schrijft terug: provider/readback → reply/meeting/scan/proposal/order → realized revenue → learning → volgende prioritering.
