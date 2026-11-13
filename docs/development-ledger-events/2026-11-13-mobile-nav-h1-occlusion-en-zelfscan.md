# Mobile EN zelfscan H1-occlusion — 13 november 2026

- **Fingerprint:** `website|mobile-nav-hidden-state|en-zelfscan-phone-h1-occlusion|20261113-v1`.
- **Bestaande eigenaar:** originele website/mobile navigatie; P0 https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215, gerelateerd Trusted Advisor #5284.
- **Oorspronkelijk negatief bewijs:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/43378918503, browserjob 131731943209, SHA `7d27a6bbc17887d7982ae23491007087d6d9e443`, 279/279 routes en 32613 links; 1 visibility-fout `/en/zelfscan phone: h1 is visually occluded by div.bg-shared-mobile-view`. SEO audit: 0 kritieke errors in geïmplementeerde regels, 69 metadatawaarschuwingen, 2 notices, dus niet letterlijk nul issues.
- **Bronrisico:** async menu CSS + dynamische root met alleen aria-hidden; bestaande globale sluitroute herstelde visuele sluiting niet native.
- **Reparatie:** native hidden bij initialisatie en elke close, verwijderen alleen bij open; gesloten aria-state in reeds bestaande sitewide CSS onmiddellijk niet-occluderend; originele browserverifier ongewijzigd.
- **Historie:** eerdere closed/unmerged kandidaat https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4702 identificeerde dit bronrisico maar had geen productiebewijs. Deze nieuwe kandidaat bevat ook de originele globale close-route en statische fail-closed CSS.
- **Preventie & regressie:** `tests/brain-website-mobile-nav-hidden-overlay-20261113.test.mjs` historische replay/shadow/canary; oorspronkelijke 279-route browser test blijft volledig actief.
- **Status:** CODE_CANDIDATE, geen beschermde merge of Netlify/provider readback, geen bewezen CRO-uplift.
