# 2026-09-23 — pricing production proof contract drift v4

Observed: protected main contained the responsive pricing/i18n implementation while Netlify production remained on an older deploy. A promotion-only merge was then incorrectly treated by generic production readback as deployment-not-applicable, and the canonical snapshot pricing proof still expected annual billing controls to be absent.

Action: update the Production Source Snapshot proof and regression test to the current monthly/yearly, Start/Run & Grow and lifecycle interaction contract. Preserve exact-source Netlify transport and exact `release.json` SHA proof as terminal release gates.

Status: pending protected CI, merge, Netlify exact-SHA deployment and live pricing readback.
