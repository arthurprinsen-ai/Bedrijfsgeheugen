# Development ledger — false-zero financial cockpit repair

Date: 2026-10-20
Fingerprint: `portal|brain-runtime|unknown-monetary-values-never-zero|v1`
Obligation: `portal|runtime-financial-truth|unknown-not-zero|20261020`
Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215
Lineage: existing Portal V2 → tenant-authorized Brain operating-loop read model → economics projection → decision cockpit → HTML

Evidence: Source code and production data inspected on 2026-10-20. The finance forecast table had no verified customer records; revenue snapshot last complete at 2026-10-18T18:52:02Z and recurring revenue-refresh job 46 timeout failures were observed independently. Do not equate this portal display fix with correcting the heavy revenue query.

Root cause: null/undefined/empty input silently became zero at three different layers.
Structural prevention: end-to-end absence propagation; explicit measured zero stays zero; numeric parsing is source-only, not fake fallbacks; value leakage is unavailable until both real inputs exist. The existing revenue and governance systems remain authoritative.

Changed paths: `portal-v2/runtime-evidence.js`, `portal-v2/company-decisions.js`, `portal-v2/company-cockpit.js`, matching unit tests, canonical System Map, learning and these docs.
Acceptance status: CANDIDATE (not LIVE until CI, protected merge, exact Netlify commit and DOM readback).
Remaining #4215 obligations: two-tenant input roundtrip and sourceRevision readback, cross-dashboard recalculation, external connector truth/revocation, tenant financial source forecasts and verified outcomes.
