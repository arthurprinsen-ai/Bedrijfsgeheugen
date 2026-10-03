# Platform final navigation contract — 2026-10-03

Observed after the first recovery:
- production desktop Platform resolved to /product;
- generated V18 mobile Platform still carried /bedrijfsgeheugen;
- runtime JavaScript could repair it in a capable browser, but final HTML itself was not canonical.

Recovery:
- final navigation contract is the last route authority;
- every visible Platform anchor is normalized to https://www.bedrijfsgeheugen.nl/product;
- final verification rejects any remaining Platform route drift;
- regression coverage includes both desktop and the historical stale mobile drawer.

Scope is limited to public website navigation.
