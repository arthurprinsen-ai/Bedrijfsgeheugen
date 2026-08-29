# Complete Website Reconstruction Design

## Goal
Restore Bedrijfsgeheugen as one complete, testable website instead of repairing isolated pages. Every intended page must have an explicit route, accepted content contract, navigation placement, ownership and regression coverage.

## Source of truth
The reconstruction uses the accepted PR110 V18.6 prototype, the current production route inventory, PR187 recovery work, current shared V18 navigation, sitemap/footer links and existing specialist/SEO pages as evidence. No page is considered restored merely because an HTML file exists.

## Route states
Every route receives exactly one state: `accepted-current`, `accepted-recovered`, `wrong-version`, `missing`, or `legacy-review`. A route can only become `accepted-*` when its required semantic anchors, navigation contract and browser smoke test pass.

## Information architecture
The catalog covers at least these groups:

- Primary: `/`, `/problemen`, `/oplossingen`, `/bedrijfsgeheugen`, `/prijzen`, `/cases`, `/kennis`, `/over-ons`.
- Account and conversion: `/inloggen`, `/aanmelden`, `/frisse-blik`, `/contact`.
- Product and operating model: `/product`, `/hoe-het-werkt`, `/zelfscan`, `/ai-scan`, `/afmaakindex`, `/monitor`, `/benchmark`, `/expertises`.
- Solutions and audiences: `/systemen-koppelen`, `/ai-adoptie`, `/ai-marketing-mkb`, `/due-diligence`, `/voor-mkb`, `/investeerders-ma`.
- Knowledge and governance: `/blog/`, `/ai-act`, `/data-soevereiniteit`, `/ai-in-bi`, `/ai-in-data-engineering`, `/ai-capability-model`, `/begrippen`.
- Integrations: `/afas-koppeling`, `/exact-online-koppeling`, `/twinfield-koppeling`, `/webshop-koppeling`, `/api-koppeling-laten-maken`.

Discovery must also inspect the current menu, megamenu, footer, sitemap, redirects and accepted prototypes for additional routes; the list above is a minimum, not a ceiling.

## Content contracts
Primary and strategically important routes get semantic contracts, not presence-only checks. `/over-ons` explicitly requires `Ons verhaal`, `Onze missie`, `Onze ambitie` and `Ons geloof`, plus the existing principles Samenhang, Continuïteit, Ruimte and Betrouwbare AI. Product/platform content must preserve Bedrijfsgeheugen/portal, bedrijfsbesturing/Business Operating Intelligence, packages, evidence, scans and the approved proposition where present in accepted sources.

## Navigation
One canonical route catalog drives desktop header, mobile drilldown, megamenu and footer validation. The existing shared V18 navigation remains the only mobile navigation owner. No second drawer implementation is allowed.

## Reconstruction matrix
Create a machine-readable website catalog containing route, group, file, state, source evidence, required anchors, desktop/mobile/footer placement, linked children and approval requirements. Generate a human-readable audit from the same catalog so agents and humans inspect the same truth.

## Testing and self-healing
Tests must fail when an intended route disappears, a strategic page falls back to a legacy version, required semantic anchors disappear, navigation omits a route, desktop/mobile catalogs diverge, or a preview does not serve the exact candidate SHA. Recovery agents must restore from accepted evidence and re-run the gates rather than accepting file presence as success.

## Preview and production
The complete reconstruction is built on a test branch/PR. A preview is only reported as usable after the public URL itself is fetched and browser-tested against the exact candidate SHA. Production remains unchanged until technical gates are green and pages that require visual/business approval are explicitly accepted. Pricing remains a business approval boundary.

## Data/AI constraints
No change may weaken current Brain/security/governance controls. AI may process data under existing stateless/governed adapters; this website reconstruction does not introduce new persistent AI data storage.

## Success criteria
1. Complete route discovery has no unexplained menu/footer/sitemap/prototype route gaps.
2. Every intended route has an explicit state and evidence source.
3. All accepted routes return successfully in the exact test candidate.
4. Primary/strategic routes satisfy semantic contracts.
5. Desktop and mobile navigation expose the intended catalog and drilldowns work.
6. Over ons contains Verhaal, Missie, Ambitie and Geloof.
7. Browser, SEO, baseline, shared-memory and promotion gates are green on the exact candidate.
8. The public test URL is independently verified before being handed to the user.
9. Production is not changed before visual/business approval where required.
