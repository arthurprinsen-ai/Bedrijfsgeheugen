# 2026-09-25 — V18 SEO baseline AFAS owner herstel

- Fingerprint: `v18-seo-baseline-afas-owner-v1`
- Root cause: `site/seo-baseline.json` miste `afas koppeling → /afas-koppeling` terwijl de canonieke SEO-order registry deze owner wel bevatte.
- Impact: gedeelde V18 Production Promotion faalde op meerdere inhoudelijk onafhankelijke PR's.
- Fix: owner toegevoegd en contracttest vastgelegd.
