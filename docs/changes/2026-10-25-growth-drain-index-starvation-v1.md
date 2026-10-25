# Growth-drain: remove fresh-event starvation

25 October 2026. Parent P0 #4446, commercial P0 #4198. Production HTTP204 responses were not provider writes: replayed=0, persisted=0, budgetExpired=true, ~72-141 old receipts scanned per scheduled call.

The existing 1-minute Netlify drain now scans a disposable privacy-safe `pending/` key prefix before legacy blobs; the event endpoint writes this index only after the canonical receipt. A successful DataHub persist and canonical receipt update permits deleting ONLY the pointer. Failures retain source and pointer for retry. Existing budget, fairness, BG211 opt-in, and historical records remain. There is no new scheduler or visitor identity.

Tests include 500 archived receipts, provider retry and idempotent receipt handling. Release needs exact-head Required, CodeQL, Netlify and protected merge. Fresh nonrobot DataHub readback, historic recovery and paid revenue need separate confirmation.
