# Current-main static i18n terminal recovery — 30 september 2026

Fingerprint: `netlify-static-i18n-cache-terminal-20260930-v1`.

## Root cause
Netlify production bleef in de buildfase falen nadat de AI Modelwijzer-recovery was gemergd. De production source is lokaal met dezelfde command chain gereproduceerd. De fail-closed statische Engelse vertaalcache bleek op de volledige actuele publieke routeset nog 16 compiler-relevante strings te missen.

De ontbrekende strings kwamen uit:
- AI Modelwijzer governance-copy;
- SVG/textlabels van de actuele kennisborgingsblog.

## Fix
- de 16 ontbrekende strings zijn toegevoegd aan een nieuwe append-only i18n cache patch;
- de Netlify production-truth skill vereist voortaan whole-current-main cache-validatie na de finale build transforms;
- `STATIC_I18N_REQUIRE_CACHE=1` blijft fail-closed; de guard wordt niet verzwakt;
- een incomplete cache wordt expliciet als build-content defect behandeld en niet meer als reden voor herhaalde deploy-retries of credential-rotatie.

## Terminal criterium
Protected merge → exact current-main production build → Netlify ready/production → exact commit identity → browser/readback groen.


## Exact merged-main reproof
After concurrent protected-main movement, terminal closure must re-run the exact production build against the final merged-main source. This successor binds the recovery to main `77e08f3ede16e4e2b1f3b064addf7c93f3d5bfb3` before another production promotion.
