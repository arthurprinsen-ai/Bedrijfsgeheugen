# CMS NL/EN same-route build syntax recovery — 2026-09-29

De same-route taalroutering was inhoudelijk juist, maar de productiebuild kon niet starten doordat de mobiele legacy-injectie in `tools/site-shell/apply-i18n.mjs` syntactisch ongeldig was.

## Root cause

De replacement-string was per ongeluk:

`mobileLanguage + 'MOBILE_LANGUAGE + '$&''`

De correcte constructie is:

`mobileLanguage + '$&'`

Daarmee wordt de gegenereerde taalkeuze direct vóór de bestaande mobiele CTA geplaatst, terwijl `$&` de gematchte CTA behoudt.

## Permanente borging

- build-transformers worden via `node --check` gecompileerd;
- de globale i18n-regressie volgt de huidige route-link architectuur in plaats van de oude select-UI;
- dezelfde pagina blijft authority voor taalwisseling: bijvoorbeeld `/prijzen ↔ /en/prijzen`;
- productie is pas groen na exact-main deploy plus echte NL→EN→NL browserreadback.

Truth boundary: repository- en testherstel is niet hetzelfde als LIVE_BEWEZEN; de productie-readback blijft de terminale authority.
