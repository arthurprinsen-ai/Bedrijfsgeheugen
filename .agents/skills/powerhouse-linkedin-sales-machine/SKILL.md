# Skill: Powerhouse LinkedIn Sales Machine

Fingerprint: `powerhouse-linkedin-sales-machine-v1`

## Doel
Gebruik LinkedIn als actieve commerciële relatie- en distributielaag, niet als losse postmachine. Combineer relatie-intelligentie, publieke posts, inbound engagement, bedrijfspagina-content en directe opvolging tot één meetbare multi-touch revenue-loop.

## Canonieke strategie
1. **Observe** — lees bestaande Powerhouse-relaties, verse bedrijfstriggers, publieke LinkedIn-posts en engagement op eigen content.
2. **Score** — prioriteer op relatiekwaliteit, beslissingsinvloed, actuele trigger, inbound engagement en outcome-historie.
3. **Engage** — reageer alleen op een concrete, aantoonbaar relevante LinkedIn-post. Reactie voegt inhoud toe en bevat geen salespitch.
4. **Air cover** — laat de Bedrijfsgeheugen-bedrijfspagina publiceren over geaggregeerde actuele prospectproblemen zonder individuele prospects te noemen.
5. **Direct follow-up** — gebruik e-mail als ondersteunde private opvolging wanneer een DM-capability niet aantoonbaar beschikbaar is.
6. **Learn** — meet comment -> profiel-/content-engagement -> reply -> gesprek -> scan -> order -> omzet en kalibreer de kanaalvolgorde.

## LinkedIn-acties
- Persoonlijk account: contextuele comments/replies op concrete posts van relevante relaties.
- Bedrijfspagina: sales-air-cover posts rond geaggregeerde probleem-/kooptriggers.
- Inbound likes/comments/reposts/shares: intent-evidence, geen automatische koopintentie.
- Reactie op een post: maximaal 3 per dag en maximaal 1 per persoon per 14 dagen.
- Commenttekst: maximaal 500 tekens, feitelijk gebonden aan de postcontext, geen generieke lof, geen afspraak-CTA en geen Bedrijfsgeheugen-pitch.

## Private outreach
- LinkedIn DM is alleen toegestaan wanneer de actuele provider een echte, geverifieerde send-DM capability biedt.
- Als die capability ontbreekt, mag Powerhouse die niet simuleren of claimen.
- Canonieke fallback is e-mail binnen `powerhouse-autonomous-relationship-outreach-v1`.
- Wanneer een LinkedIn-comment beschikbaar is, krijgt die eerst 24 uur ruimte voordat e-mail naar dezelfde persoon wordt verstuurd.
- Opt-out, klacht, negatieve reactie en do-not-contact blokkeren alle verdere directe outreach.

## Identity
- Persoonlijke LinkedIn-posts blijven onder de bestaande personal-life-only identity gate.
- Sales-air-cover hoort op `linkedin_company`, niet op persoonlijk LinkedIn.
- Contextuele comments namens Arthur mogen zakelijk-inhoudelijk zijn omdat ze reageren op een concrete zakelijke post; ze mogen nooit worden vermomd als een persoonlijke-life post.

## Runtime
- Planner: `public.powerhouse_prepare_linkedin_sales_machine_v1(date)`.
- Dispatcher: `public.powerhouse_dispatch_linkedin_sales_machine_v1(date)`.
- Worker: `powerhouse-linkedin-sales-machine`.
- Comment executor: bestaande `powerhouse-social-publisher` cockpit autopilot.
- Bedrijfspost-generator: bestaande `powerhouse-content-orchestrator` via `powerhouse_content_recommendations`.
- Private follow-up: `powerhouse-autonomous-outreach`.
- Scheduler-owner: uitsluitend `powerhouse-commercial-learning-v1`.

## Verboden
Geen scraping/platform-bypass, geen bulk generieke comments, geen gefingeerde DM-capability, geen prospectnamen in sales-air-cover posts, geen dubbel contact, geen comment op een post zonder company-specific evidence.


## Permanente revenue-first uitvoeringsregel
- Deze capability is **execution-first**: signaleren zonder passende actie is geen terminale uitkomst.
- Powerhouse beslist autonoom tussen publieke LinkedIn-engagement, bedrijfspagina-air-cover, private e-mail en wachten/nurture op basis van evidence, fatigue, suppression en kanaalbeschikbaarheid.
- Geen handmatige goedkeuring per comment, company-post of private follow-up wanneer alle bestaande gates groen zijn.
- Een relevante publieke post mag een autonome inhoudelijke comment krijgen; een cluster van actuele prospectproblemen mag een geanonimiseerde `linkedin_company` post voeden; een sterk private koopsignaal mag via het ondersteunde private kanaal worden opgevolgd.
- Niet elk signaal hoeft contact op te leveren. `wait/nurture` is een geldige autonome actie wanneer timing of evidence nog onvoldoende is.
- Kanaalvolgorde wordt outcome-driven geleerd: comment -> engagement -> private follow-up -> reply -> meeting -> scan -> order -> realized revenue.
- Likes, comments, shares, profiel-/contentinteractie en andere LinkedIn-signalen zijn features in de score, nooit op zichzelf bewijs van koopintentie.
- Alle acties blijven uniek: provider acknowledgement, action-dedupe, semantic content-dedupe, person cooldown en suppression zijn harde gates.
- Iedere nieuwe provider-capability (bijvoorbeeld echte LinkedIn DM of create-reaction) wordt pas geactiveerd na capability-probe, identity verification, provider-ack test en regressietest.


## Terminal production proof — LIVE
- Protected main merge: `73e954d9e62af66cf6f47ff63df9041a98a2d519` (PR #3167).
- `powerhouse-linkedin-sales-machine` ACTIVE v2.
- `powerhouse-autonomous-outreach` ACTIVE v2.
- `powerhouse-social-publisher` ACTIVE v74.
- Canonical planner/dispatcher RPCs are present in production.
- Sales-air-cover recommendation exists for the current run date and the LinkedIn comment queue is live.
- The canonical recurring commercial owner remains `powerhouse-commercial-learning-v1`; no dedicated LinkedIn Sales Machine cron was introduced.


## Externe relatie-intelligentie
Gebruik standaard `powerhouse-relationship-external-intelligence-v1`. Relevante publieke internet-, bedrijfs- en ondersteunde LinkedIn-updates worden na geldige entity matching gekoppeld aan de canonieke person → company → customer → opportunity/NBA-lineage en wegen mee in scoring, timing en next-best-action. Externe evidence is nooit op zichzelf koopintentie; provenance, freshness, confidence, suppression, cooldown en outcome-learning blijven harde gates. Geen gevoelige persoonsinferenties en geen los nieuwsarchief als eindpunt.


## Public-intent bridge — v1
Fingerprint: `powerhouse-linkedin-sales-machine-public-intent-bridge-v1`.

Website intent is part of the same commercial context as LinkedIn and e-mail. High-signal public actions such as a completed selfscan report request and checkout start must emit a PII-free canonical `/api/growth-event` observation. Personal contact data stays in the purpose-bound form/order path and must never be copied into SEO/growth telemetry. Growth events feed attribution, Company/Relationship context, Growth Swarm prioritisation, next-best-action and outcome learning; they never override consent, suppression, fatigue, evidence or provider-capability gates.


## Public-intent bridge — terminal production proof
Fingerprint: `powerhouse-linkedin-sales-machine-public-intent-bridge-v1-live-proof`.

Status: **LIVE_PROVEN_RUNTIME**.

- Implementation merged to protected main at `6bce84b1a3d3f7eba1b7291895f7e7925945fd31`.
- Production Release Readback run: `36474142016` — success.
- Skill Projection run: `36474141948` — success.
- Netlify production deploy: `6abac341b59a3f00080a08dc`.
- Netlify commit_ref: `6bce84b1a3d3f7eba1b7291895f7e7925945fd31`.
- Published at: `2026-09-28T19:44:41.885Z`.
- Selfscan report-request and checkout-start now emit PII-free commercial intent into the canonical growth/datahub loop.
- Personal contact data remains in purpose-bound lead/order handlers and is never copied into growth telemetry.
- This bridge is part of the existing LinkedIn Sales Machine / Growth Swarm / Persuasion Revenue Optimizer lineage; no parallel CRM, intent store or scheduler was introduced.


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


## Bounded prep runtime — 2026-09-29

Fingerprint: `linkedin-sales-bounded-prep-v1`.

De LinkedIn Sales Machine mag nooit de volledige `powerhouse_person_intelligence_v1` opbouwen om maximaal drie dagelijkse contextreacties te selecteren. De prep moet eerst actuele LinkedIn/public-research events begrenzen, daarna alleen de bijbehorende relaties en recente action-state ophalen, en pas daarna scoren.

Hard runtime contract:
- candidate-first, not population-first;
- maximaal 250 recente public-research events in de candidate stage;
- maximaal 3 contextreacties per dag;
- 14 dagen cooldown per persoon;
- geen sales pitch of gefabriceerde feiten in publieke comments;
- LinkedIn DM blijft `UNAVAILABLE` zolang geen provider-write capability aantoonbaar bestaat; fallback is de bestaande e-mailroute;
- geen retry-loop op statement timeout; root cause fix + provider/readback verplicht.
