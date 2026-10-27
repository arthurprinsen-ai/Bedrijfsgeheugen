# Development ledger — website / portal coherence

- Date: 2026-10-01
- Obligation: website-portal-coherence-20261001
- Root cause: sequential page composers and shared CSS allowed late global selectors to override page-specific design; public product, pricing, contact routing and Portal V2 had no single terminal coherence contract.
- Change: terminal route-scoped public-site finalizer + Portal V2 final parity stylesheet.
- Contact canonical route: https://www.bedrijfsgeheugen.nl/contact
- Product architecture: Powerhouse Intelligence / Agents / Connect.
- Production build: `tools/site-shell/finalize-website-coherence-v1.mjs` is a final writer before sitemap and release evidence.
- Preview build: same final writer and ordering.
- Regression: `tests/brain-website-coherence-v1.test.mjs`.
- Learning: `brain/learning/2026-10-01-website-portal-coherence-v1.json`.
- Skill: `skills/website-portal-coherence.md`.
- Terminal condition: protected merge to main, Netlify exact-main production deployment and public readback on pricing, product, AI ecosystem, systems integrations, contact and Portal V2.

- Follow-up: deploy-preview browser regression found `/prijzen` missing three canonical hero hooks on all seven protected viewports. Recovery restores those hooks in the composer and adds a Brain regression assertion; the visual gate remains fail-closed.

## 11:04 CEST — professional parity recovery
Observed from live screenshots: product copy exposed internal implementation language, pricing CTA geometry was uneven, package finder did not produce a package recommendation, public portal demo leaked a broken runtime/legacy visual state, and AI discovery had regressed.

Recovery lineage:
- contextual product proposition + three-line Powerhouse model;
- package-advisor route;
- isolated interactive portal demo;
- equal-height pricing cards and CTA baseline;
- portal visual containment;
- AI navigation restoration;
- canonical /contact routing;
- regression coverage extended in tests/brain-website-coherence-v1.test.mjs.

Terminal production evidence must still be attached after protected merge and public readback.
