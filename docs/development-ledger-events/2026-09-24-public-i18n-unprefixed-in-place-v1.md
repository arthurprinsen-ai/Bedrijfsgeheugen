# 2026-09-24 — Public i18n unprefixed in-place

- Fingerprint: `public-i18n-unprefixed-in-place-20260924-v1`
- Fix PR: #2759
- Fix commit: `40462534fbd3d7ee44360058a3aa2412663debad`
- Scope: publieke website / pricing / taalwissel
- Root cause: niet-geprefixte publieke routes navigeerden onbedoeld naar `/en/*` in plaats van in-place te wisselen.
- Fix: publieke unprefixed locale-switch blijft op dezelfde route; static prefixed locale routes blijven ondersteund.
- Prevention: interaction proof verplicht; route/marker-presence is onvoldoende.
- Delivery: borging wordt onderdeel van de actuele protected-main productie lineage.
