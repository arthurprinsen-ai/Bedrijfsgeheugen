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


## Execute-or-explain terminal contract

Fingerprint: `seo-cro-execute-or-explain-v1`.

Every material SEO/CRO opportunity discovered by a daily run must terminate in the same cycle as exactly one of:

- `EXECUTED`: a bounded, reversible, evidence-gated change was implemented through the canonical protected delivery lineage and then carried through production readback; or
- `REJECTED_WITH_EVIDENCE`: no material write is allowed, with a persisted reason code and the exact missing/contradicting evidence.

An operator-facing recommendation without either terminal state is a contract failure.

Allowed rejection reason codes:
- `INSUFFICIENT_SEARCH_EVIDENCE`
- `INSUFFICIENT_CONVERSION_EVIDENCE`
- `CANONICAL_OWNER_ALREADY_SERVES_INTENT`
- `CANNIBALIZATION_RISK`
- `EXPECTED_ORDER_VALUE_TOO_LOW`
- `GUARDRAIL_OR_TRUST_RISK`
- `HUMAN_AUTHORITY_REQUIRED`
- `NO_SAFE_REVERSIBLE_CHANGE`

For `REJECTED_WITH_EVIDENCE`, persist:
1. opportunity/query and canonical owner;
2. evidence inspected and freshness;
3. exact reason code;
4. exact evidence missing or conflicting;
5. what observable condition would make the opportunity executable in a later cycle.

Do not use CI/tool/transient delivery failures as rejection reasons. They are recovery work and must remain in the same execution lineage.

When evidence supports one or more safe changes, execute up to the configured daily maximum rather than merely describing them. The operator report must state what was changed and the measured/readback state; if no change was made, it must state the evidence-backed reason why.


## Bilingual SEO revenue architecture — 30 september 2026

Fingerprint: `seo|nl-en|revenue-ownership|hreflang|v1`.

The public website is one commercial search system across Dutch and English, not a Dutch SEO estate with translated copies added later.

Canonical rules:
- Dutch canonicals remain unprefixed. English canonicals use `/en/*`.
- Every indexable NL route that is part of the public localized estate must have an EN peer with self-canonical, reciprocal `hreflang="nl"`, `hreflang="en"` and `x-default` to Dutch.
- The production sitemap must contain both NL and EN canonicals and reciprocal xhtml hreflang entries. Legacy `/nl/*` URLs never enter the sitemap.
- English SEO keywords are researched and owned independently; never mechanically translate Dutch target keywords and assume equivalent demand.
- `site/seo-order-map.json` + `site/seo-order-expansion.json` remain the canonical intent-owner registry. `site/seo-locale-revenue-map.json` is the bilingual market/metadata/revenue projection of those owners and must have exactly one entry per registry owner.
- Every NL and EN primary/secondary keyword has one owner. Cross-page collisions fail closed. Supporting pages inherit the localized commercial owner instead of creating parallel keyword ownership.
- High-value English owners must have market-specific title, description and keyword metadata. Supporting English pages inherit the EN owner/cluster for attribution even when their visible copy is a normal translation.
- Internal links are revenue architecture, not link-count SEO. Related support routes link to their canonical money owner; money owners link to relevant cluster pages and the next commercial destination. The same graph is projected to `/en/*`.
- The production chain is: localized pages → bilingual revenue-link projection → sitemap generation → bilingual SEO/revenue validation → release evidence.
- Search intelligence maps Dutch and English queries back to one canonical business intent owner while preserving the actual localized landing canonical and localized keyword cluster for attribution.
- Market evidence must be keyed by `locale + market + keyword`; a single keyword primary key is insufficient for multilingual SEO. Canonical runtime authority is `public.powerhouse_seo_keyword_intelligence_v1` with the revenue-priority projection `public.powerhouse_seo_keyword_revenue_priority_v1`.
- DataForSEO/GSC demand signals are diagnostics and prioritization evidence. They become commercial truth only after the closed loop records landing → CTA → lead → meeting/proposal → paid order → realized revenue.
- Revenue opportunity scoring may prioritize CPC, search volume and intent, but it may not fabricate demand or treat forecast value as realized revenue.
- The Modelwijzer is a canonical commercial intent owner for Dutch `ai modellen vergelijken` and English `AI model comparison`; it must route to implementation/governance/data-sovereignty/pricing/commercial next steps rather than terminate as an isolated tool.
- Every material keyword/metadata/internal-link change must preserve cannibalization ownership, protected delivery, exact-main production identity, public readback and outcome writeback.

Measured seed evidence from 30 September 2026:
- NL `bedrijfsprocessen automatiseren`: 480 monthly searches, CPC €14.53.
- NL `ai governance`: 390 monthly searches, CPC €15.86.
- NL `data soevereiniteit`: 260 monthly searches, CPC €6.33.
- EN/UK `AI model comparison`: 390 monthly searches, CPC €3.30.
- EN/UK `ai governance`: 1,300 monthly searches, CPC €24.01.
- EN/UK `sovereign ai`: 2,400 monthly searches, CPC €13.28.

These are dated market observations, not guaranteed future volumes. Refresh them through the canonical DataForSEO evidence path and learn from realized commercial outcomes.


### Static English cache is a release contract

Fingerprint: `seo|nl-en|static-i18n-cache-complete|v1`.

- Every new or changed visible Dutch string on an indexable public route must have a committed English cache entry before merge when production uses `STATIC_I18N_REQUIRE_CACHE=1`.
- A translated component fragment is not sufficient when the localized builder sees a combined source string; cache the exact source string emitted by final source HTML.
- Run the canonical localized-route cache validation before protected merge. Missing translations are a production blocker, never a deploy-time surprise.
- SEO title, description, H1, CTA, governance copy, footer copy and commercial handoff copy are all inside this contract.
- A Netlify build failure caused by `STATIC_I18N_CACHE_INCOMPLETE` must be repaired at the source cache and then replayed through protected delivery; never disable the cache gate or silently fall back to Dutch on English routes.

## Skipped recommendation recovery — 2026-10-29

Fingerprint: `seo|daily-blog|skipped-not-reserved|v1`.

The daily first-mover single-flight reservation is held only by active (`suggested`), accepted (`accepted`) or completed (`done`) content decisions. `skipped` remains historical evidence, not capacity. A rejected duplicate keyword must not block a distinct, independently evidenced search-intent candidate; still never create more than one new blog candidate per natural day. When retroactively correcting canonical aliases, update the original recommendation status to `skipped` with intent-owner attribution and production runtime proof, never erase its history, reset approval or introduce another executor. The daily resolver, canonical blog queue, protected publisher and independent production readback remain the only authority.

- Daily qualified-visits target (`config/visitor-growth-target.json`): indexing and technical SEO first, then keyword-to-page match, internal links, LinkedIn links with UTM; new content only for a proven intent gap (5 Nov 2026, fingerprint `seo|visitor-growth-target|daily-qualified-visits|20261105-v1`).

## 5 november 2026 — commerciële aanvraag telt uitsluitend na providerbewijs
- De originele `frisse-blik.html` is de bestaande publieke conversieroute; `lead-intake` Supabase Edge v1 en `commercial_leads` zijn de originele ontvangende eigenaar. Nieuwe CRM's, webhook-fallbacks, schedulers of verzonnen leads zijn verboden.
- `primary_cta_click`, een ingevuld formulier, een getoonde bedankpagina, `scan_completed`, een HTTP-antwoord zonder expliciete `{ok:true}`, een Calendly UI-event en een geaccepteerde adviseursmail zijn **verschillende** fasen, geen bewezen verkoop. Alleen de serverbevestiging `{ok:true}` bewijst hoogstens dat de oorspronkelijke leadregistratie is geaccepteerd; een daadwerkelijk gekwalificeerde lead, bevestigde boeking en betaalde order vereisen apart onafhankelijke readback.
- Bij `lead-intake` HTTP-fout, `{ok:false}`, ongeldige JSON of netwerkstoring: behoud akkoord en ingevulde klantgegevens uitsluitend in de reeds bestaande sessie; toon niet-gevoelige uitleg, laat de bestaande Calendly-boeking veilig doorgaan en claim geen geregistreerde lead. Geen ongevraagde automatische dubbelversturing; voorkom gelijktijdige formulierverzoeken.
- Zonder werkende Calendly-configuratie mag de agent nooit `onBooked` of een succesbericht simuleren. De bezoeker krijgt een gewone contactoptie; persoonlijke contactgegevens gaan niet naar analytics of het publieke incidentlog.
- Voor élke website-release die dit formulier wijzigt: draai `tests/brain-frisse-blik-provider-receipt-20261105.test.mjs`, bestaande consent/lead-endpoint-regressies, tweetalige statische cache, Required/CodeQL/browser, exacte Netlify productie-SHA en controleer bronbewijs zonder fake klantverkeer. Heropen dezelfde ONE BRAIN-fingerprint bij regressie: `seo|sales|frisse-blik-lead-intake-silent-loss|20261105-v1`.
- De oorspronkelijke dagelijkse SEO-/Growth-executor meet wekelijks GSC non-brand klik → consented landing → serverontvangst → kwalificatie → Calendly-providerboekingsbewijs → offerte → betaald. Geen "groen" bij uitsluitend bezoekers, CTA's of een synthetische test.

## 10 november 2026 — originele SEO money-page producer → owner-executor-ontvangst
Fingerprint: `seo|original-money-page-execution-handoff-not-silent|20261110-v1`.
De originele SEO-resolver mag `UPDATE_MONEY_PAGE` niet enkel als forecast bewaren en tegelijk de dag als uitgevoerde optimalisatie melden. Hij schrijft maximaal drie niet-dubbele, recente source-backed website-overdrachten naar het **bestaande** `powerhouse_content_recommendations` (`target_channel=website`, `recommendation_type=seo_money_page_update`, `status=suggested`), inclusief exact bestaande canonical, intent, keyword, GSC/paid cache evidence, originele SEO Order Engine als eigenaar, beschermde releasegate en output/readback-slag. Retry gebruikt insert-ignore-duplicate: nooit terugzetten van `done`/`accepted` naar `suggested`.
De bestaande SEO Order Engine/GitHub delivery verwerkt alleen de oorspronkelijke canonical owner. Geen parallelle scheduler, publisher, CMS, social-delivery of nieuwe SEO-bron; geen websitehandeling of `EXECUTED` claim door het aanmaken van een overdracht. De daadwerkelijke source change, protected CI, exacte Netlify deploy/publieke canonical en CTA en latere zoek-/conversieresultaten blijven onafhankelijke ontvangst- en effectbewijzen. Een open overdracht is EVIDENCE_DUE; Heartbeat en Brein mogen bron-OK niet als terminale SEO-groei tonen. De vijf oorspronkelijke money candidates op 10 november waren Exact Online en Twinfield (één eigenaar elk); geen duplicate blog.

## 11 november 2026 — Eén gekwalificeerde scan-/prijzeninstroom, exact consumer readback

Oorspronkelijke eigenaren #4198 en #4215. Fingerprint: `portal|scan-pricing|growth-event-silent-non-ack-and-en-funnel-gap|20261111-v1`.

Alle bestaande publieke Bedrijfslek-, Frisse Blik- en workshopscans lopen via de originele `/api/powerhouse-scan-ingest` Netlify-proxy en de oorspronkelijke Supabase Edge `powerhouse-scan-ingest` naar **dezelfde** `scan_inzendingen`, `powerhouse_runtime_events` en `growth_events` records. Verplicht: scan-ID opgeslagen, runtimeevent-ID opgeslagen/gelezen, én `growth_events` onafhankelijk op `scan:${submission_key}` teruggelezen met juiste event_type en scan_id. Een genegeerde databasefout of HTTP-succes zonder consumerbewijs mag NIET `ok:true` of 'opgeslagen en verwerkt' betekenen. Retourneer herstelbare 503 met dezelfde oorspronkelijke idempotente sleutel; bestaande scan-client bewaart die voor retry. Geen tweede CRM, scheduler of losse retry-executor.

De actuele bron mag 'organic' niet uit een anonieme scan afleiden: zonder toegestane verified acquisitie is `unattributed` correct. De **enige** oorspronkelijke website-growth-meetproducer herkent NL en EN `/zelfscan`, `/frisse-blik`, `/prijzen`, `/afsluiten`, `/contact`, `/aanmelden`. Een bezoek aan een Engelstalige scan is maximaal één primary CTA + één scan-start, nooit een betaalde order of aangemelde lead. Cross-origin lookalikes mogen geen scan-start creëren; commerciële klik en anonieme scan worden nooit automatisch een geauthenticeerde tenant.

De originele Portal V2 domeinstaat en inputmap houden klantvelden, externe brondata en geverifieerde scanclaims bij tenant/revisie. Alleen expliciet geautoriseerde claim en independently observed portal/Brain ACK mogen die keten verder brengen. De oorspronkelijke CRO/Heartbeat-leeragent gebruikt exposure, pre-treatment toewijzing, volwassen holdout, geverifieerde uitkomst en next-run toegepast leren; geen winstclaim uit dashboard-, prijzen- of scanklikken.

Regressies `tests/brain-scan-price-portal-one-loop-20261111.test.mjs` en `tests/seo-order-measurement.test.mjs`; originele Edge source en provider-deployed versie moeten overeenkomen. De originele Required/BRAIN/CodeQL en Netlify/Edge exacte productie-readback zijn verplicht voordat dit als LIVE wordt geclaimd. Historische oude missers alleen herstelbaar op originele gescopeerde bronrecords, nooit door gefabriceerde lead of dubbele provideractie.

## 11 november 2026 — Productieprobe is geen klantconversie

Fingerprint `powerhouse|scan|production-smoke-entered-real-cro-outcomes|20261111-v1`. De oorspronkelijke Powerhouse Scan Production Proof-workflow stuurt echte technische verificaties door bestaande scan-/Edge-/growth-consumers; die mogen wel voor **technische** source→consumer-readback tellen maar **niet** als organische scan, echte lead, betaalde order of Heartbeat-leeruitkomst. Bij exacte combinatie van originele gescopeerde `doel=__PRODUCTION_SMOKE__` en `omvang=verification-only` zet dezelfde oorspronkelijke `powerhouse-scan-ingest` Edge de `powerhouse_runtime_events.context.learning_scope` op `testing_only` en `data_quality` op `SYNTHETIC`. De originele `growth_events` rij blijft onder dezelfde idempotente `scan:${submission_key}` opgeslagen en gelezen, maar met `is_robot=true`, `synthetic_production_smoke=true` en `measurement_scope=NOT_CUSTOMER_CONVERSION`. Alle echte klant-scans volgen de gewone OBSERVED/ANONYMOUS_SCAN-route met aparte geautoriseerde claim. Geen tweede scanner, cron, eventqueue, provider of opgewaardeerde uitvoeringsstatus. Herstel historische gescopeerde facts idempotent met onafhankelijke readback; geen valse conversiestatus. Regression `tests/brain-scan-smoke-cro-proof-20261111.test.mjs` via originele protected Required/BRAIN/CodeQL, Supabase GitHub Integration en exacte actuele Edge broncode-readback.


## 12 november 2026 — Prijzen, scans en conversies: oorspronkelijke Powerhouse/Heartbeat-ontvangst alleen met bewijs

Fingerprint `portal|all-fields-external-scans-pricing|original-source-consumer-heartbeat-receipts|20261112-v1`. De publieke `/prijzen`, `/pakketadvies`, `/zelfscan` en `/frisse-blik` blijven uitsluitend via de bestaande `bg-growth-measurement` CRO-eigenaar en bestaande originele scanprovider lopen. Drie pakketadviesselecties geven één native bestemming en één `consider` intent; een CTA-klik is nooit een betaalde order, tenant-identiteit of geverifieerde scan-claim. Een scan telt als technisch volledig overgedragen pas na echte `scan_inzendingen` opslag, `powerhouse_runtime_events` ID én onafhankelijke `growth_events` event-ID + matchende scan-ID. De originele retry gebruikt dezelfde idempotente sleutel; voor ontbrekend bewijs geen groen. Technische smoketests en demo's `is_robot=true / SYNTHETIC / testing_only` en **nooit** meetellen als klantgroei.

Breng echte provider-gekoppelde conversies, consent en customer-scoped brongegevens verder naar de oorspronkelijke ONE BRAIN/Powerhouse/Heartbeat-lus; analyseer gedrag, relevante A/B treatment én controle, echte betaalde/afgesproken provideruitkomst, en bewijs dat de volgende natuurlijke run een aantoonbaar bewezen les gebruikt. Zonder dat laatste blijft businessloop `DEGRADED/EVIDENCE_DUE`. Bij bron- of providerblokkade blijf je de oorspronkelijke uitvoerder draaien en documenteer je exact oorzaak, idempotente sleutel, consumer, bronrevisie, eigenaar, herstel, test, providerreadback en leereffect in de bestaande originele verplichting. Geen tweede scheduler, CRM, bronwaarheid of duplicaatpublicatie. Zie `tests/brain-original-all-inputs-one-loop-contract-20261112.test.mjs` en originele #4198/#4215.

## AI answer engines: ChatGPT + Claude (2026-11-12)

Fingerprint `seo|public-ai-search-discovery-and-proposition-truth|20261111-v1`. Use the **existing SEO Order Engine / BG169 only**. Audit live `robots.txt` search/retrieval agents (OAI-SearchBot, ChatGPT-User, Claude-SearchBot, Claude-User) separately from training bots. Verify `llms.txt` states the real portal/platform + advisory/scans/integrations proposition and matches visible site canonical pages. Track independent actual-answer mention/citation receipts for versioned non-branded queries; when no authorised answer source is available, persist `NOT_MEASURED`, never fabricate 0%, citations, clickthrough, leads or revenue. Existing intent owner first; no content cannibalization. Route through original protected PR, Required + CodeQL + exact Netlify main deploy/readback, and original ONE BRAIN -> Heartbeat -> Portal -> next daily learning ACK. Failure remains open under same original writer, not a new scheduler or competing publisher. Source contract: `config/seo-growth-loop.json#optimization.ai_answer_visibility`; regression: `tests/brain-ai-discovery-20261111.test.mjs`.

## 12 november 2026 — Eén installabele app-ervaring voor website én portaal, zonder tweede business-OS

Fingerprint `portal|website|one-installable-business-app-responsive-touch-with-no-private-cache|20261112-v1`, originele Portal V2-eigenaar #4215 en commerciële/meting eigenaar #4198. Bedrijfsgeheugen moet vanaf publiek aanbod en nulmeting tot de geauthenticeerde bedrijfsomgeving voelen als **één rustige, onmiddellijk bedienbare app** op iOS, Android en tablets. Vertrouw niet op een visueel ontwerp alleen: exacte origin, echte touch-area ≥44px, safe-area bij notch en home-indicator, keyboard focus, herkenbare actieve navigatie, goede 390px- en 820px-layout en een echte install-prompt alleen bij browser-`beforeinstallprompt`. De USP is directe controle over gegevens, beslissingen, acties en geverifieerde resultaten; geen Revolut-branded imitatie en geen verzonnen ROI.

ÉÉN identiteit: `/app.webmanifest` met native 192+512 PNG plus maskable SVG, start `/portal-v2/`; dezelfde metadata en branded install-ervaring op publieke pagina’s én Portal V2. Publieke pagina’s krijgen via de **bestaande** `tools/site-shell/apply-cms-runtime.mjs` de app schil en vier links Ontdek/Scan/Prijzen/Mijn bedrijf; geen aparte CMS-page kopieën of tweede website menu-engine. Echte HTML `href`s zijn absolute HTTPS URLs voor de actieve site. Portal V2 gebruikt juist de **originele** `mountMobilePrimaryNavigation` en `navigatePortal`, op tablet nu dezelfde vier acties en onder dezelfde `isProtectedTrustPage` tenant/role gates. Geen dubbele navigatie, mini-CRM of tweede klant-state.

De optionele browser `/bg-app-sw.js` dient **uitsluitend** HTTPS `navigate` via vers netwerk door, toont bij offline alleen een generieke connectiemelding met `no-store` en mag NOOIT klantgegevens, HTML, API-responses, tokens of PII cachen. Geen push, sync, periodieke worker, autonome agent, tracking of dubbele executor. De app-shell blijft een visuele/navigation enhancement; provider-/Powerhouse-/Heartbeat-effectstatus komt uit de originele tenant-scoped bron. Verbied `FULL_GREEN` voor klantwaarde zonder echte klant- en effectbewijs.

Regression `tests/brain-single-installed-app-mobile-tablet-20261112.test.mjs` en Playwright `tests/integration/portal-v2-website-one-app-phone-tablet.spec.js`; release alleen protected Required, original CodeQL, Netlify exact-main READY, Portal V2 DOM readback en onafhankelijke publieke route. Meting van echte installaties, retentie, taakduur en geautoriseerde omzet volgt via **bestaande** consent-gebonden CRO-events, nooit nieuwe analytics. Autonome veilige reparatie onder originele owner en ONE BRAIN en logging in bestaande ledger; geen parallelle scheduler/authorisatie-bypass.


## 12 november 2026 — commerciële SEO-kans mag niet bij aanbeveling eindigen

Fingerprint: `seo|original-money-page-source-to-terminal-outcome-ack|20261112-v1`.

Voor `seo_money_page_update` uit `SEO_ORIGINAL_MONEY_OWNER_HANDOFF_V1` gelden de originele `powerhouse_content_recommendations` met stabiele `dedupe_key`, tenant, bronrevisie, canonical money-owner, verantwoordelijke uitvoerder, echt exacte release-SHA en consumer-ACK als één bewijsgeheel. Originele SEO Order Engine gebruikt dezelfde protected website-PR; originele #175 registreert de bronrevisie; originele ONE BRAIN #140 verwerkt de **actuele** source SHA; commerciële Heartbeat leest exact dezelfde SHA; CRO/experiment- en omzetuitkomst komt pas na echte en onafhankelijke productie-events. Geen aparte SEO/CRO-aanbevelingsschrijver of tweede scheduler.

Vóór een bronkans van `suggested` naar daadwerkelijk verwerkt mag: final-built Nederlandse/Engelse site-tekst plus JSON-LD + besliskaart, echte primaire CTA, exact-Netlify-CURRENT READY, toegankelijkheid/mobiele readback, originele recommendation-ID en ontvangen consumer-receipt. Een gewijzigde website is `DELIVERED_NOT_EFFECT_PROVEN`, geen verkregen lead of leerresultaat. Bij `ORIGINAL_BRAIN_INPUT_ACCEPTED_WAIT_CRO_OUTCOME` blijft CRO-status OPEN tot echte variant/holdout, voldoende looptijd en effectberekening. Bronfouten/ontbrekend GSC/GA4 worden geëscaleerd binnen dezelfde originele keten en gaan nooit als nul of stil succes door. Regresietest: `tests/brain-seo-money-page-trust-20261112.test.mjs`; root-cause-/preventie-log: `brain/learning/2026-11-12-seo-money-page-trust-v1.json` en bijbehorend menselijk ledger.

### 2026-11-13 — SEO_NETLIFY_PRODUCTION_SOURCE_HANDOFF_20261113: vrijgegeven website ≠ gekwalificeerde commerciële uitkomst

Echte PR #5700 Netlify READY `6af6bb27b1fccdc5adc91cd1` / main `66b67ac366e073ca068e5f1e23938a9792ae7dce` en oorspronkelijke observation `c418e0cd-70a0-466d-97b0-5113c9242b75` zijn geborgd in `website_release_readback` binnen één bestaand dagmanifest. Originele 16-bronnen-SHA `a451cb2714fb1363053622ef644cf605ea4e8ea261d6c74c4956ee2962135d4e` is door #140 en Heartbeat onafhankelijk gelezen. Geen enkele bronopname, CI, live pagina of CTA-click bewijst experimentele uplift, gekwalificeerde lead, betaalde order of effectleren. Stop pas met de oorspronkelijke CRO-verplichting na daadwerkelijke, betrouwbare variant-/holdoutmeting en 7/14/28-dagen-resultaten; de bronverplichting blijft `OPEN` met `NOT_EXECUTED` totdat dit er is. Volgende releases moeten automatisch via de **bestaande** geregistreerde Netlify-bron door dezelfde SHA-lineage worden verwerkt; deze eerste eenmalige projectie telt niet als bewijs dat toekomstige automatische verwerking al gegarandeerd is. Geen nieuwe scheduler of tweede executor.
