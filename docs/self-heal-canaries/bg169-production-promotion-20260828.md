# BG169 production promotion canary — 2026-08-28

Purpose: verify the deterministic Production Promotion Controller can promote an exact tested PR head through the existing GitHub → Netlify production path without changing runtime website behavior.

Canary constraints:
- docs-only change; no runtime files changed;
- exact candidate SHA must equal tested head SHA;
- PR base must equal current `main` before promotion;
- CI and Netlify preview must be green;
- last-known-good SHA must be present before promotion;
- GitHub merge uses the candidate SHA as server-side head guard;
- production is not marked green until the resulting merge SHA is independently verified in Netlify production.

This file is the inert acceptance marker for that flow.
