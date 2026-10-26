# Canonical ledger — Mira historic rejected-asset prevention, 2026-10-25

Existing canonical owner P0 #4439; run date 2026-10-25. Candidate only before protected merge and deployed Supabase readback.

Production Brain shows 2 provider-quality rejection occurrences for `7lGMacfGJcGL3WGCF4XN` (start and middle) with latest measured face=0.860 (< 0.940). Existing replacement check covered only the most recent rejected OpenArt history. Corrected original router now checks all historical `brain_failure_occurrences` for the submitted OpenArt history and declines re-verification before MP4 transfer or vision spend; Brain unavailable=fail-closed. No extra scheduler, queue, provider generation, public action or duplicate Meta sender. Same locked 2026-10-25 winner.

Regression `tests/brain-mira-rejected-history-permanent-dedupe-20261025.test.mjs`; merge only after Required+CodeQL and native preview, then independent Edge-production readback. Today's Mira Instagram obligation remains blocked until real live provider evidence.
