# 2026-10-29 — CRO bg-interactie Edge config recovery event

- **Obligation:** SITE-CRO-RAW-ACK-5141-20261029-EDGE-CONFIG; same existing incident #5141 and parent protected-merged PR #5144.
- **Observed production gate:** `Supabase Edge Production Authority` run `40927339145`, job `123636253798` failure `SUPABASE_EDGE_FUNCTION_NOT_DECLARED_IN_CONFIG:bg-interactie`.
- **Root cause:** deployed existing browser telemetry Edge slug is absent from tracked Supabase config; protected main gate correctly failed closed.
- **Evidence:** provider `bg-interactie` ACTIVE version 10, existing `verify_jwt=false`; no migration 20261029180000/20261029181000 seen on first readback after parent merge.
- **Fix candidate:** one exact `[functions.bg-interactie]` block in `supabase/config.toml`, preserves current provider auth mode/entrypoint; no second scheduler or writer.
- **Regression:** `tests/brain-cro-edge-config-5141.test.mjs`; Brain learning JSON and SEO/CRO agent skill updated.
- **Human:** `docs/changes/2026-10-29-cro-edge-allowlist-5141.md`.
- **Unproven:** protected merge, Edge exact production readback, two migrations, Netlify exact release, legitimate event UID, real commercial conversion. Do not mark green without evidence.
