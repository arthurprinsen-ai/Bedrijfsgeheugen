# Canonieke website mobiel herstel — 11 november 2026

- **Fingerprint:** `website|mobile|header-menu-slider-interaction-and-cta-contrast|20261111-v1`
- **Owner:** bestaande websitebouwer en beschermde GitHub → Netlify levering; oorspronkelijke ONE BRAIN-coördinatie #4198.
- **Bronbewijs:** vijf iPhone-screenshots met witte/onleesbare tweede CTA, verschillende mobiele koppen, menu dat niet betrouwbaar sluit, kennisvergelijker die niet op het zichtbare vlak schuift en overlappende inhoud. Niet elke gemelde knop is onafhankelijk gereproduceerd.
- **Oorzaak:** conflicterende legacy/V18 CSS, `overflow-x:hidden` op iOS Safari, ontbrekende klikbare closebediening en aparte range-input buiten de getoonde vergelijking. Geen klant-/omzetbewijs verondersteld.
- **Herstel:** één idempotente publieke CSS/JS-projectie in de bestaande laatste Netlify-buildfase, in plaats van losse HTML-fixes die door generators verdwijnen. De bestaande menu-engine blijft eigenaar; onafhankelijke closebediening herstelt aria en scroll. Kennisslider krijgt één native range in het zichtbare vlak.
- **Veiligheid:** portaal/tenant/auth-apps uitgesloten van marketing-CSS, geen nieuw CMS, scheduler, sender, OAuth, prijswijziging of parallelle executor.
- **Regressie:** `tests/brain-sitewide-mobile-interaction-recovery-20261111.test.mjs`, `tests/site-shell-mobile-ui-recovery-20261111.test.mjs`, `tests/site-shell-mobile-sitewide-recovery-20261111.test.mjs`; originele cross-browser assurance op /kennis met menu sluiten, sticky scroll en slider-eindpunten.
- **Historische rode poort:** PR #5613 / GitHub Actions run #43015777977, `hygiene / admission` faalde op `Enforce canonical integration closure`. De eerdere kandidaat had wel menselijke changelog, maar geen machine learningrecord en append-only ledger. Beide zijn nu in **dezelfde** PR-lineage toegevoegd; geen guard verzwakt.
- **Uitkomst bij het schrijven:** CODE_CANDIDATE, **niet LIVE** en niet Red Dot-gereed. Alleen exacte protected CI, preview browser, merge, Netlify current READY en onafhankelijke productie-interactiemeting mogen terminal groen opleveren. Bij rood blijft incident #4198 voor deze fingerprint open.
- **Overdracht:** originele website owner controleert tests en browser-proof, originele BRAIN leert uitsluitend van geverifieerde provider- en gebruikersuitkomsten.
