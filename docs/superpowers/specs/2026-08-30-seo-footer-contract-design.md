# Canonical SEO Footer Contract — Design

Date: 2026-08-30
Status: approved direction, pending written-spec review
Scope: public website only; portal/auth/internal routes are explicitly governed exceptions

## Goal

Bedrijfsgeheugen uses one canonical footer across every public, indexable website page. The footer is a shared site component, not page-owned content. It must support the existing SEO and keyword strategy without creating keyword cannibalization, dead links, duplicate destinations, or drift between pages.

The historical V18 visual/product baseline remains protected. The footer is the explicit exception: V18 also receives the canonical sitewide footer. No other V18 body content may change as part of this work.

## Single source of truth

`.github/canoniek/voet.html` is the only authoritative footer source.

No public page may maintain an independent copy as an editable source. Build tooling injects/replaces the footer deterministically. A generated page may contain a rendered copy, but it must be byte-equivalent after normalization to the canonical footer.

## SEO requirements for the footer

A footer change is only promotable when all of the following are true:

1. Every footer href resolves to a real, allowed route with no 404 or unintended redirect chain.
2. Footer destinations align with `site/seo-baseline.json` and the existing keyword-owner map.
3. Anchor text supports the intended destination and does not assign the same commercial/search intent to competing routes.
4. The footer does not introduce keyword stuffing. Contextual page copy remains the primary place for topic depth; the footer is an architecture/internal-link layer.
5. Important pillar routes receive stable sitewide links where appropriate: bedrijfsgeheugen, process automation, systems/integrations, AFAS/Exact/Twinfield/API, AI adoption/governance/AI Act, data sovereignty, benchmark/knowledge and relevant trust/company pages.
6. Legal/support links remain available without being treated as commercial keyword targets.
7. The footer contains exactly one canonical company identity/contact block and one privacy/contact set. No conflicting phone, email, company label or duplicated footer section is allowed.
8. The footer is crawlable HTML; it must not depend on client-side JavaScript to become visible to crawlers.

## Sitewide application

The build pipeline injects the canonical footer into every public/indexable HTML route, including the restored V18 homepage.

Explicit exclusions are machine-readable and limited to routes that are not public marketing pages, such as authenticated portal shells, private/internal tooling, error/thank-you pages where a marketing footer is intentionally inappropriate, or other noindex application surfaces.

An exclusion must have both:
- a declared route/file;
- a reason.

An undeclared missing footer is a release-blocking error.

## Technical SEO contract

The footer contract sits inside the broader SEO promotion gate. Every public/indexable page must also satisfy:

- unique, purposeful title;
- meta description;
- exactly one H1;
- canonical URL on `https://www.bedrijfsgeheugen.nl`;
- correct robots/indexability state;
- Open Graph/social metadata;
- valid JSON-LD where applicable;
- sitemap coverage;
- no unintended duplicate indexable build artifacts;
- valid internal links and cluster relationships;
- no orphaned strategic routes;
- one-primary-keyword/one-owner-route discipline from the existing keyword strategy.

A footer fix must never be used to suppress an unrelated technical SEO failure.

## Build and validation flow

1. Source pages/builders produce their page body.
2. Historical V18 is reconstructed and its protected body is verified.
3. Persistent SEO head metadata is applied.
4. Canonical footer injection replaces zero or one existing marketing footer with exactly one canonical footer.
5. Static route/link/SEO tests run.
6. Footer-specific tests compare every governed page against `.github/canoniek/voet.html` after normalization.
7. Keyword-owner and cluster SEO checks run.
8. Netlify deploy-preview is built from the exact PR head.
9. Public preview smoke checks visible V18 identity, footer identity, real footer links and SEO metadata.
10. After promotion, the real production URL is checked again. Build success alone is insufficient.

## Footer modification gate

Any pull request that changes `.github/canoniek/voet.html`, the footer injector, footer exceptions, or footer SEO mapping must declare scope/tag `component:footer` and `area:seo`.

The change is blocked unless automated tests prove:

- the canonical footer is still structurally valid;
- every footer link resolves;
- destinations exist in the website route contract;
- strategic anchors map to the expected SEO owner pages;
- no duplicate owner is created for the same primary search intent;
- all governed pages render the same footer;
- V18 changes only in the footer region, not elsewhere in the protected body;
- preview and production smoke checks succeed.

This means footer edits are treated as SEO changes, not cosmetic edits.

## Failure and self-healing behavior

When a footer/SEO gate fails, automation must report the exact page, link, owner keyword and violated contract. It must not silently weaken the rule or add broad exceptions.

Safe automatic repairs may include restoring the canonical footer, correcting a known internal route, regenerating the site from the canonical source, or re-running after a transient deploy delay. Semantic changes to keyword ownership or destination strategy require an explicit, tested contract update.

## Parallel development

The footer owns `component:footer`. Other agents may work simultaneously on independent tags such as `component:hero`, `component:pricing`, `area:knowledge` or `area:cases`. A footer PR may not modify those owned components merely to make its tests pass.

Because footer injection occurs late in the build, page-specific work does not need to copy or reconcile footer HTML. This removes a major source of merge conflicts and allows simultaneous work.

## Acceptance criteria

This design is implemented only when:

- one canonical footer source exists;
- every governed public page gets it automatically;
- exceptions are explicit and justified;
- the V18 homepage uses the same footer without other V18-body drift;
- footer links and anchors comply with SEO/keyword ownership;
- the full technical SEO gate remains active;
- footer modifications cannot merge when SEO conditions fail;
- exact public preview is green;
- exact production deploy is green and the live `www` site is verified.
