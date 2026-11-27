# Append-only event 2026-11-17 — original Mira asynchronous producer receipt

- Owner: existing Powerhouse Daily Publisher/OpenArt MCP producer, existing Supabase powerhouse-instagram-media-router, original sole Instagram Meta writer; P0 #5232.
- Observation: original authenticated job claim and provider generation_preflight exist, but no exact original pin of OpenArt asynchronous PENDING history before media completion. A premature task exit strands a CLAIMED job with incomplete provider receipt; reruns cannot confidently distinguish already-spent and unspent state.
- Repair: original authenticated action pin_generation, pure source/owner/model/CAS guard; persist exactly one provider history and project/master reference while status GENERATING; repeat same history idempotently; reject other IDs and invalid claim. Nothing published/approved by this action.
- Tests: tests/brain-mira-original-openart-async-receipt-20261117.test.mjs; learning: brain/learning/2026-11-17-mira-async-openart-history-not-pinned.json.
- Release requirements: protected CI & CodeQL, original protected merge, native Supabase router version and direct exact-source readback, then original real source/claim/paid history/provider complete/Mira identity/native output/Meta ID and Brain PROCESSED independent proof.
- Status: source code candidate, not live Reel or autonomous closed loop.
