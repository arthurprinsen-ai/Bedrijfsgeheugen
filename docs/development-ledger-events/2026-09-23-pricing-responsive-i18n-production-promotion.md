# 2026-09-23 — pricing responsive/i18n production promotion

The responsive pricing and English-route repair was merged to protected main as `8421e5afd4e8b8709cedd44136a182a5f67328c2`, but Netlify production still reported the older deploy `6ab3ad55f0f4920007cb81bf`.

Root cause is release-transport drift, not a new pricing-code defect. The canonical recovery path in this repository is the Production Source Snapshot workflow. This promotion changes only its operational refresh marker so a protected-main push triggers the existing exact-source packaging, authorized Netlify transport, bounded `release.json` SHA proof and pricing production-content proof.

Closure remains pending until the promotion PR merges, the snapshot workflow succeeds, Netlify production reports the new protected-main SHA, and public NL/EN pricing readback succeeds.
