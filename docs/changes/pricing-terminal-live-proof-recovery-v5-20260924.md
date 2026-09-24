# Pricing terminal live proof recovery v5 — 24 september 2026

## Aanleiding
PR #2811 heeft de concrete SEO-runtimefout hersteld: `UTILITY_ROUTES` wordt nu expliciet gedeclareerd en de regression eist die concrete declaratie. De post-merge Required-run wees daarna nog één governance-gap aan: de kandidaat had Brain learning en een development ledger, maar geen afzonderlijk human-readable change document.

## Fix
Deze closure voegt het ontbrekende change-document toe en koppelt het bewijs terug aan dezelfde obligation `pricing-terminal-live-proof-20260924-v1`.

## Permanente preventie
Een material candidate is pas closure-compleet wanneer dezelfde diff Brain learning, append-only ledger én human-readable documentatie bevat. Semantic learning wordt pas daarna geëvalueerd.

## Productie
De productcode op current main bevat de SEO utility-routefix en pricing/i18n-fixes. Deze v5-closure retriggert de canonieke Production Source Snapshot zodat exact current main naar Netlify gaat en daarna de pricing/i18n browser verifier kan sluiten.
