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
- Visual regression registry selectors must track stable canonical markup, not decorative legacy elements. For pricing, protect the current hero heading, SaaS/consulting tabs and plan cards; the Brain regression test enforces registry/source parity.
