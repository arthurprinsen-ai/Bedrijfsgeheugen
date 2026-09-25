# 2026-09-25 — static i18n terminal fail-closed

- Production SHA with defect: `9e630bd6360698a829751b9ba8ba4daf2273b595`.
- Production source snapshot proved exact SHA and pricing content, then browser gate failed: `English route still shows the Dutch pricing H1`.
- HTTP source readback: `/en/prijzen` returned `lang=en`, `data-bg-static-locale=en`, `data-bg-static-translated=false`, H1 still Dutch.
- Base cache blob before fix: `63d4e10854c4ddbfa1300fbb5186d8392ec7abfd`.
- Proven complete cache blob restored: `0be053e028cc3d8a78c1e3391397e35072a7050c`.
- Production contract restored: network=0, require-cache=1.
- Volatile version stamp excluded from translation corpus.
- Terminal state: pending protected merge, exact-main Netlify deployment and production browser readback.
