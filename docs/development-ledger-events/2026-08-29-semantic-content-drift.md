# 2026-08-29 — Semantic content drift website

## Type
RECOVERY / CONTRACT_CHANGE

## Fingerprint
`website.semantic-content-drift.accepted-baseline`

## Symptoom
De website kon technisch groen zijn terwijl een bestaande route inhoudelijk niet meer de door de gebruiker geaccepteerde pagina vertegenwoordigde. Concreet bestond `/over-ons` nog, maar de eerdere merk-/verhaalpagina was vervangen door de doelgroepversie “Geen callcenter. Je krijgt Arthur.” Ook mobiele navigatie kon routes wegfilteren doordat de nieuwe drill-down een kleinere afgeleide structuur gebruikte.

## Impact
Technische, SEO- en deploychecks konden groen blijven terwijl betekenisvolle content en informatiearchitectuur veranderden. Daardoor was groen geen bewijs van de bedoelde website-identiteit.

## Root cause
V18.8 was beschermd als homepage/runtime-artifact, niet als volledige site-identiteit. Onderliggende pagina’s en navigatie hadden geen accepted semantic baseline. Nieuweer in Git werd impliciet behandeld als correcter, terwijl commitvolgorde geen acceptatiebewijs is.

## Evidence
- Commit `79aadbc4b3c746e85083d025ab1a68bf197e1c00` vermeldt expliciet dat Over ons werd vervangen door de doelgroepversie.
- Parent `4e6444e1228903853d085a4dac45f2885e37ca99` bevat de eerdere merkpagina met het oprichtersverhaal, waarom Bedrijfsgeheugen bestaat, “praktiseren wat je preekt” en de waarden Gewone taal / Geen big bang / Van jou, niet van mij.
- Pre-drilldown navigatiecommit `890f729578ccc11a0244e61c33d6ecc5ff54e07f` is de routebron voor de nieuwe mobiele UX.

## Definitieve herstelarchitectuur
- `site/accepted-baseline.json` beschermt primaire routes en semantic anchors.
- `site/navigation-baseline.json` beschermt de routecatalogus.
- `site/accepted-pages/over-ons-main.html` bevat de geaccepteerde Over-ons semantiek.
- De bewezen V18-builder blijft ongewijzigd in `tools/bouw-v18-production-core.mjs`; de wrapper past daarna `tools/apply-site-baseline.mjs` toe.
- `assets/js/menu.js` bouwt de nieuwe drill-down uit de bestaande server-side mobiele bron en verzamelt losse oude toplinks automatisch onder Meer.
- `tests/site-baseline-guardian.test.mjs` is onderdeel van de V18-productiepoort.
- `site/change-scope.schema.json` verplicht expliciete scope voor toekomstige protected content changes.

## Self-healing regel
Unexpected semantic content drift = RED, ook als route, HTTP, H1, canonical en technische SEO geldig zijn. Verplichte lus: block promotion → restore alleen afwijkende route vanaf accepted last-known-good → behoud additieve technische verbeteringen → rerun baseline/browser/V18/SEO → writeback incident + preventie.

## Herbruikbare les
Een website is niet alleen een build-artifact of verzameling routes. De geaccepteerde betekenis van pagina’s en de informatiearchitectuur zijn production invariants en moeten machineleesbaar beschermd worden. Chronologisch nieuwer is nooit automatisch inhoudelijk correcter.
