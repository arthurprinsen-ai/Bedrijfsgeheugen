# Website ↔ Portal Coherence

## Doel
Voorkom dat nieuw gegenereerde pagina's, pricing, het openbare Powerhouse-productverhaal en Portal V2 uit elkaar lopen of door generieke CSS-regels visueel breken.

## Canonieke regels
- Contact is altijd de echte route `/contact`; `#contact` en `/#contact` zijn ongeldig.
- Iedere publieke build krijgt als laatste UI-pass `tools/site-shell/finalize-website-coherence-v1.mjs`.
- Pricing gebruikt dezelfde merkbasis als de homepage en Portal V2: navy, warm geel, wit/paper, oranje alleen als accent.
- `/product` beschrijft één Powerhouse-platform met Intelligence, Agents en Connect en verwijst naar pricing, portal en koppelingen.
- Paginaspecifieke selectors worden route-scoped via `body[data-bg-route]` zodat generieke namen als `.card`, `.flow` en `.step` niet opnieuw layouts breken.
- Portal V2 gebruikt `portal-v2/site-parity-v1.css` als laatste visuele guard.
- Productie en deploy-preview voeren exact dezelfde coherence-pass uit.

## Preventie
Bij nieuwe publieke pagina's of globale styles moet de regressietest `tests/brain-website-coherence-v1.test.mjs` blijven slagen. Geen LIVE-claim zonder main/deploy parity en publieke readback van minimaal /prijzen, /product, /ai-ecosysteem, /systemen-koppelen, /contact en /portal-v2/.
## Professional public-surface invariant
- Public copy describes customer value; never expose internal synchronization, build, parity or implementation language as hero/proposition copy.
- A second architecture/proposition section may supplement a page, but must sit inside the page narrative after its primary hero and may never look like a second site header.
- Pricing recommendation controls must resolve to an actual recommendation experience, not silently degrade to a generic contact page.
- Cards in the same commercial comparison row use equal-height structure and a shared CTA baseline.
- Public portal demos are isolated demonstration surfaces. Customer/runtime portal pages are not used as a sales demo when their state, legacy visuals or customer navigation can leak through.
- Every visual model is container-bounded on desktop and mobile; SVG/canvas/media may never escape its card.
- Intelligence, Agents and Connect are the canonical product lines. AI Modelwijzer, AI Capability Model and AI Governance remain discoverable from canonical navigation or a directly related product surface.
- Contact always resolves to /contact; generated and runtime CTAs are subject to the same route rule.

## Self-playing interaction invariant
- “Interactief” op publieke pagina’s betekent zichtbaar gedrag zonder dat de bezoeker eerst hoeft te klikken: een relevante flow beweegt of wisselt zelfstandig en blijft handmatig bedienbaar.
- Respecteer `prefers-reduced-motion`; automatische beweging stopt of blijft statisch voor bezoekers die minder beweging vragen.
- Interactie is inhoudelijk: beweging toont de gesloten Powerhouse-lus of een concrete productflow en is nooit decoratieve animatie zonder betekenis.
- Publieke pagina’s hebben maximaal één primaire hero. Productlijnen, Agents, Intelligence en Connect worden in de context van die pagina verweven in plaats van als losse tweede propositie erboven of eronder te worden geplakt.
- Geen lege kaarten, lege dynamische grids, grote nutteloze witruimtes of herhaalde “Gerelateerde oplossing”-blokken. Meerdere commerciële vervolgstappen worden gebundeld in één contextueel Powerhouse-vervolgblok.

## 11 november 2026 — mobile sitewide navigation and visual evidence (original website owner)

INCIDENT_PROTOCOL: agents-skills-register-and-self-fix-v1. Canonical obligation `website|mobile|navigation-coherence-geometry|20261111-v2`; original PR #5618, issue #4198. All website UX agents reuse the **existing** final Netlify public-site build, original website release lane and the existing sitewide browser test; do not start a separate builder, mobile menu engine, deployer, monitor or incident ledger.

Before a public global style or navigation release, check the actual rendered owner: some V18 pages use `#v18MobileDrawer`, while other public templates use `#bgMobileNav` or `#bgSharedMobileNav`. Never infer the active drawer from a hidden DOM node. With the original Menu/Sluit toggle, assert actual sheet left/right = viewport bounds, top directly below the fixed header, visible close state, no duplicate close, no WhatsApp overlap, and no horizontal overflow. Confirm mobile keyboard Escape and touch click; sticky after scrolling, white/secondary CTA 4.5:1 computed contrast and 44px minimum touch target; `/kennis/` slider native Home/End and pointer; `/product` conversion buttons.

The original `.github/workflows/lane-website.yml` must execute `tools/site-shell/sitewide-mobile-interaction-browser-check.mjs` on 320 and 390px real browser contexts across /, /product, /prijzen, /contact and /kennis/. Keep the broad public-route and desktop checks enabled. CI install or preview failures are never browser PASS. Only protected Required, BRAIN, CodeQL, merge, **current** Netlify READY matching the exact main SHA, and independent actual production browser readback justify LIVE for the tested scope. Retain failure screenshots, root cause, fingerprint, repair, regressions and resulting proof in the original development ledger + `brain/learning/2026-11-11-sitewide-mobile-navigation-coherence-v2.json`; do not mark every route or Red Dot readiness proven without measured evidence. Pending evidence stays OPEN/EVIDENCE_DUE with same original owner.

## 11 november 2026 — sitewide UX acceptance, interaction evidence and WCAG-AA

Deze permanente regel hoort bij de **bestaande website-uitvoeringsketen** en het al gemergede herstel #5618, niet bij een nieuwe scheduler, browser-runner, menu-engine of deployer. Incidentfingerprint: `website|sitewide|interaction-coverage-and-normal-text-contrast|20261111-v1`. Eigenaar: `agent-website-ux` via de oorspronkelijke beschermde website GitHub → Netlify writer en het originele incidentregister.

**Bewijsklassen strikt scheiden.** De eerdere 277 routes × drie viewports = 831 geslaagde visibility/CLS-checks tonen geen functioneel succes van elk interactief element. De acht Playwright-interactiechecks voor vijf kernroutes op 320/390px bewijzen alleen de daadwerkelijk geobserveerde menu/Sluit/Escape, header, CTA-contrast en kennisslider-acties. Status `LIVE_BEWEZEN` geldt uitsluitend voor die geteste en op productie gelezen herstelrelease. Bewijs van iedere andere knop, tab, modal, accordion, link, keuzeformulier, slider of sluitactie is `EVIDENCE_DUE` tot werkelijk waargenomen browseractie plus resultaat.

**Per route en viewport:** inventariseer daadwerkelijk aanwezige klikbare elementen uit de canonieke publieke route-inventaris, inclusief NL/EN en dynamisch opgebouwde UI. Leg voor ieder element route, selector of stabiele test-id, type, toegankelijke naam, eigenaar, trigger, verwachte uitkomst, geobserveerde toestand/URL/DOM-wijziging, viewport, screenshot, browserfouten, productiedeploy/commit en onafhankelijke readback vast. Dek minimaal menu openen → navigeren → groep terug → Sluit, sliders touch/keyboard, tabs, accordions, keuzeformulieren, dialogen, close/Escape, conversie-CTA en veilige fouttoestanden af. Alleen zichtbaarheid, een HTTP 200 of `aria-expanded` zonder gebruikersresultaat mag niet als functionele dekking tellen. Verbied echte providerverzending, aankoop of klantdatamutatie bij browserproeven.

**WCAG AA:** normale tekst, inclusief desktopheader-menu's en gewone linklabels, vereist een gemeten berekend kleurcontrast van minimaal **4,5:1**; voor aantoonbaar grote tekst is de relevante ondergrens **3:1**. De bestaande `tools/site-shell/v18-header-menu-contrast-check.mjs` gebruikt nog een standaardondergrens van `3:1`; in de geslaagde vorige browserlog was het slechtste Oplossingen-paneel **3,78:1**. Dat is **geen bewijs** van AA voor gewone tekst. Pas de CSS en de bestaande browserpoort in dezelfde oorspronkelijke website owner eerst veilig aan en controleer daadwerkelijke tekstgroottes en contrast op productie voordat de aparte WCAG-acceptatie groen mag worden. Verlaag of omzeil de browserpoort nooit om de acceptatie te sluiten.

**Overdracht is verplicht en verliesloos:** registreer iedere niet-bewezen route/selector/viewport als `EVIDENCE_DUE`, met bron-SHA, eigenaar, herstelactie, idempotente correlatie en consumer-ACK naar het bestaande ONE BRAIN/incidentregister. Een geopende of toegewezen taak is geen ACK en een PR-test is geen productie-readback. Blijf fouten via dezelfde originele writer oplossen: rood → oorzaak → gerichte correctie → beschermde Required/BRAIN/CodeQL → merge → exacte Netlify CURRENT/READY-main-SHA → onafhankelijke werkende browseractie op productie → documenteer bewijs en leerregel. Houd historische mislukte tests, 404-probes en brugautoriteitsfouten afzonderlijk; geen valse `ALL_GREEN`-claim. Laat het bestaande systeem doorlopen en maak geen parallelle keten.

## 12 november 2026 — Bedrijfsgeheugen App Experience, één originele website↔portaal UX-laag

Fingerprint `website|portal|one-installable-app-feel-safe-offline-and-tablet-dock|20261112-v1`. Houd dezelfde oorspronkelijke sitewide builder `tools/site-shell/apply-cms-runtime.mjs` en gedeelde `assets/sitewide-mobile-ui-20261111.css` als enige publieke mobile interaction style owner. Voeg geen tweede menuschip, overlay, scroll engine, publicatie- of conversie-executor toe. Website PWA manifest `/app.webmanifest` opent de openbare bron; klanten krijgen alleen hun eigen `/portal-v2/app.webmanifest`, beide met originele merkiconen en `display:standalone`. Apple homescreen-meta gebruikt viewport-fit en full HTTPS href. Extra touch feedback maakt CTA/overzicht sneller bedienbaar maar moet het bestaande werkende menu, sticky header, slider, formulieren en beschermde pricing-route intact laten.

De gedeelde `/app-sw.js` is netwerk-only behalve **één openbare, PII-vrije offlinepagina**; nooit Supabase, portal, API, session, contract, bestelling, e-mail, tokens of TENANT-data cachen. Offline = geen uitvoer/geen getoonde actuele klantdata. Een installatieknop is alleen zichtbaar na browser-native `beforeinstallprompt` of iOS homescreen-mogelijkheid, vrijwillig in bestaande accountpop-over. Geen kunstmatig bootproces, geen tweede herlaadplanner en geen ingebouwde sample-ROI. Toets 320/390 telefoon, 768/820 tablet, desktop en reduced-motion op echte geproduceerde pagina's, inclusief route, tap target, PWA JSON en veiligheid. Originele website CRO→ONE BRAIN→Powerhouse→Heartbeat bewijsregels ongewijzigd en exacte publicatie-URL-readback vereist. Zie `tests/brain-installable-app-safe-private-20261112.test.mjs`.
