# 2026-09-21 — Instagram daily Mira provider isolation

- Incident: the daily Mira chain was unstable despite the Mira-only rules.
- Observed causes: Buffer returned 429 RATE_LIMIT_EXCEEDED for a 24-hour window; Powerhouse had no valid COMPOSIO_API_KEY; non-Buffer Instagram provider IDs could enter Buffer reconciliation; identical replacement blockers inflated attempts to 162.
- Runtime fixes deployed: powerhouse-social-publisher v31, powerhouse-instagram-media-router v11, bg-buffer-sync v9.
- Delivery behavior: Composio remains primary. Buffer is only a governed secondary Instagram transport when its circuit is closed. Both remain behind the same Mira Reel-only proof, atomic claim, publication capability, dedupe and provider readback.
- Retry behavior: repeated identical external blockers no longer count as new attempts. Exact generated Mira media is reused; no regeneration, image fallback, second winner, duplicate post or Make route.
- Repository lineage: PR #2525.
- Terminal state: pending exact-head gates, protected merge and final main/runtime readback.
