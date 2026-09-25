# SEO status current-main recovery — 2026-09-25

The latest paginacontrole SEO status snapshot is carried onto current main through a normal recovery branch instead of the bounded writer path.

## Root cause
The source candidate was stale against main. The first successor used `writer/paginacontrole`, which correctly enforces a 50-line impact budget but is the wrong transport for a larger already-generated status snapshot.

## Prevention
Recovery keeps one obligation lineage, changes only `seo-status.json`, runs protected CI, and never bypasses branch protection.
