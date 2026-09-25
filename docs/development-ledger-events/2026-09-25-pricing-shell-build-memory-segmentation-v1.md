# 2026-09-25 — pricing-shell build memory segmentation v1

Observed:
- Netlify linked production build `6ab66fd0fe4e3e3df396b891` failed with build exit code 2.
- Exact build reproduction reached `tools/prijzen-uit-de-homepage.mjs` after V18 transforms and the process was killed.
- Pricing runtime source itself had already passed repository/full-build contracts.

Change:
- `stage=all` now executes `rewrite`, `normalize`, and `verify` in fresh child Node processes.
- Existing per-stage implementation and ordering are preserved.
- Child failure remains fatal and reports stage/code/signal.

Terminal condition remains unchanged: complete Netlify build → exact production SHA → pricing content → real browser pricing/i18n proof.
