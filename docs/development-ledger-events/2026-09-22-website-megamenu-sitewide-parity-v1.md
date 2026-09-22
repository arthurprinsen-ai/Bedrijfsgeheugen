# 2026-09-22 — Sitewide navigatie- en megamenupariteit

Fingerprint: `website-megamenu-sitewide-parity-v1`

## Signaal
Op de route `/wijzigingen` was het desktopmenu **Meer** zichtbaar smaller en daardoor slechter leesbaar dan dezelfde navigatie op andere pagina's.

## Root cause
De site gebruikt al een canonieke V18-shell en een contrastguard, maar de browserguard voor het Meer-megamenu opende alleen de homepage. Daardoor kon berekende geometrie per route afwijken zonder releaseblokkade.

## Wijziging
- desktop Meer-paneel krijgt één viewport-gecentreerde breedtecontract;
- verticale positie wordt afgeleid van de actuele onderkant van de V18-header;
- resize/scroll houdt die positie synchroon;
- browsercheck vergelijkt navigatielabels, breedte en linkerzijde op zes representatieve routes;
- regressietest borgt dat deze sitebrede guard niet stil kan verdwijnen.

## Evidence
GitHub kandidaat: PR #2594. Static test, regression en build zijn onderdeel van de website-lane. Netlify preview en multi-route browser/readback blijven releasevoorwaarden.

## Preventie
Een menucheck op één route telt niet meer als bewijs voor sitebrede shellpariteit. De productie-readback hergebruikt voortaan dezelfde multi-route check.
