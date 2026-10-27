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
