# 2026-10-01 — Netlify production transport timing

Adjusted the production source snapshot flow so provider latency does not trigger fallback transport prematurely. The release remains fail-closed on exact production source identity and bounded readback.
