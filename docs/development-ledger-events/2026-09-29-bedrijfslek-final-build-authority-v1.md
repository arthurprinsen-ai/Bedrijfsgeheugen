# 2026-09-29 — Bedrijfslek final build authority

- Outcome type: RECOVERY
- Fingerprint: `growth|bedrijfslek|final-build-authority|v1`
- Observed: exact-main Netlify deployment still rendered historical homepage/selfscan content.
- Root cause: historical V18 selfscan regeneration plus homepage marker check outside the rendered home scope.
- Fix: standalone selfscan authority, scoped home transform, final artifact guards.
- Required proof: protected merge -> exact-main Netlify -> functional live readback of homepage + Bedrijfslek.
