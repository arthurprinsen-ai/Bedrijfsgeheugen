# 10 november 2026: source-first SEO Twinfield website release

**P0:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
**Producer:** bestaande GSC / DataForSEO → SEO opportunity resolver
**Original website writer:** bestaande SEO Order Engine en GitHub protected main→Netlify.

**Resultaat/productiegrens:** kandidaatbron met canonical alias en exacte HTML/EN-cache; geen ranking-, lead- of orderbewijs. Geen tweede website-uitvoerder.

**Waarom apart van #5591:** De oorspronkelijke gecombineerde SEO PR #5591 is inhoudelijk gedocumenteerd, maar GitHub/Supabase preview blokkeert exact-head Required door remote preview migration-history drift; fail-closed behouden. De website-only correctie betreft enkel bestaande websitebron, SEO intent owner map en statische i18n-cache. Het herstel van de ontbrekende commerciële money-page forecast→execution handoff blijft gekoppeld aan dezelfde oorspronkelijke ONE BRAIN P0, zonder vervangende database of cron.

**Preventie en regressie:** `tests/brain-seo-twinfield-canonical-source-20261110.test.mjs` beschermt één owner, CTA, canonical, HTML-tags, vertaalde source keys. Vereist: protected Required+CodeQL, Netlify deploy exacte `main` SHA en publieke canonical/title/meta/CTA. Pas latere GSC/GA4 metingen mogen aantoonbare verbetering onderbouwen.
