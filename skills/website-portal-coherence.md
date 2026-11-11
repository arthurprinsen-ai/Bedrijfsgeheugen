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
