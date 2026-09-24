# 2026-09-24 — Public i18n unprefixed in-place

- Fingerprint: `public-i18n-unprefixed-in-place-20260924-v1`
- Fix PR: #2759
- Fix commit: `40462534fbd3d7ee44360058a3aa2412663debad`
- Scope: publieke website / pricing / taalwissel
- Root cause: niet-geprefixte publieke routes navigeerden onbedoeld naar `/en/*` in plaats van in-place te wisselen.
- Fix: publieke unprefixed locale-switch blijft op dezelfde route; static prefixed locale routes blijven ondersteund.
- Prevention: interaction proof verplicht; route/marker-presence is onvoldoende.
- Delivery: borging wordt onderdeel van de actuele protected-main productie lineage.

## Production delivery evidence

- Canonical Production Source Snapshot run: `36012915185`.
- Attempt 1: exact source packaged; linked build unavailable; Netlify MCP deploy returned `401 Unauthorized`.
- Attempt 2: same canonical path rerun after fresh connected authorization; linked build still `ok=false`; deploy again returned `401 Unauthorized`.
- Classification: provider deploy-auth hard boundary, not application/i18n regression.
- Status: source fix and governance are preserved; `LIVE_BEWEZEN` remains false until provider success + exact production SHA + browser interaction proof.
