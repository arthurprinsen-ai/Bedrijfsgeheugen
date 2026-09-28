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

## LinkedIn-profielcontext
Publieke LinkedIn-updates over bekende connecties en hun bedrijven zijn niet alleen input voor comments. Zodra Powerhouse ze als geverifieerde runtime-evidence kent, worden ze via `powerhouse-external-relationship-intelligence-v1` standaard onderdeel van de persoon-, bedrijfs- en klantcontext. Deze context mag de prioriteit, timing, researchbehoefte en next-best-action beïnvloeden, maar een like, post, functiewijziging of andere LinkedIn-activiteit is nooit op zichzelf koopbewijs.
