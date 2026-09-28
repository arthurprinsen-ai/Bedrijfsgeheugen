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
