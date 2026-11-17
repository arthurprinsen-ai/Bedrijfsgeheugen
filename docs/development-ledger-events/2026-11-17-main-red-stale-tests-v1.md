## 2026-11-17 — CI_REPAIR — main rood door twee verouderde testaannames (kandidaat)
- **Oorzaak:** een test pinde het lockaantal 874 (lock = 879) en een test eiste een letterlijke source-vorm.
- **Wijziging:** beide tests asserteren de uitkomst; geen lock- of workflowwijziging.
- **Lokaal bewijs:** beide testbestanden 3/3 groen, twee migratielocktests groen.
- **Niet bewezen:** backend-lane op exact-head, productie.
- **Status:** `CANDIDATE`.
