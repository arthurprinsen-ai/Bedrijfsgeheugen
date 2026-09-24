# Public i18n unprefixed in-place fix — 24 september 2026

## Incident
Op de publieke prijzenpagina kon de taalwissel naar Engels nog de foutmelding `Switching language failed. Try again.` tonen.

## Root cause
De runtime bevatte twee tegenstrijdige contracten: `init()` documenteerde in-place switching voor niet-geprefixte publieke routes, maar `setLocale()` navigeerde voor publieke routes alsnog naar `/en/*`. Daardoor hing de knop af van een afzonderlijke gelokaliseerde route.

## Fix
PR #2759 verwijdert die navigatie-afhankelijkheid voor niet-geprefixte publieke routes. De bestaande pagina blijft staan, locale state wordt aangepast en de vertaling wordt op dezelfde DOM toegepast. Bestaande locale-prefixed routes blijven geldig voor directe navigatie en SEO.

## Borging
`tests/brain-i18n-in-place-switch-v1.test.mjs` is aangescherpt en `tests/brain-public-i18n-unprefixed-in-place-v1.test.mjs` bewaakt het contract plus de skill-projectie.

## Terminal bewijs
Geen `LIVE_BEWEZEN` zonder Netlify provider-success, exacte productie-SHA/readback en browser-level bewijs van lifecycle-tab, pakket-tab, maand/jaar-toggle en NL→EN-switch.
