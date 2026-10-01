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
