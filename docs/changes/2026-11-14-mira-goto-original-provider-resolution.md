# 2026-11-14 — Resolve Google News goto URLs through original DataForSEO task

Parent-P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5232
Predecessor: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5769 (merged, production Edge v974).
Original owner: `powerhouse-mira-problem-radar-v1`, original cron #120 / original ONE BRAIN source and media consumer.

## Provider and production proof
The authorised original source radar was invoked for publication date 2026-11-14 with scheduler token. Original `net._http_response` ID **31065** independently returned **HTTP503**, `SOURCE_RECOVERY_DUE`, `MIRA_UNIQUE_SOURCE_WINNER_REQUIRED`, provider `dataforseo_news=18`, `stored=0`, `eligible=0`, no provider execution errors. The newly deployed original `sourceIntake` identified **18/18 candidate news URLs rejected as `REJECTED_SOURCE_URL_QUALITY`**; bounded samples all pointed to `google.com/goto?url=...`. This is verified source-transport cause, not an Instagram OAuth failure or an instruction to accept Google URLs.

Original source quality `classifyMiraSourceUrl` correctly rejects Google redirect/search hosts. NEVER modify its denial list, fake a redirect destination, turn an invalid URL into a publisher citation, or change a locked winner. No real new Mira source/winner/media/provider post for 14 Nov has yet been proven.

## Native provider remedy
DataForSEO official API documentation https://docs.dataforseo.com/v3/serp/google/news/live/advanced/ specifies `resolve_goto_urls: true` as an optional property **within the same Google News Live Advanced request** to return actual destination URLs, default false. Their docs state it can add up to 40 seconds to response latency. Set this provider-native option on all existing DataForSEO fallback tasks. Keep exactly the original eight source queries (six approved PH-P entrepreneur topics and two independently sourced personal-life topics) and original run-date rotation. Collect the same 8 network searches concurrently only to prevent serial 8×40-second resolution from overrunning the unchanged 120-second cron HTTP limit; process search results serially in original ordered consumer loop and record failures by query. No extra paid tasks or parallel publisher; provider task concurrency is not a new scheduler or writer.

Unresolved redirects, news lacking independent publication date, duplicate source/topic, unmatched original PH-P classification, weak score, non-native video or missing Meta post proof remain blocked. The original source gate, immutable winner, OpenArt original media producer claim and original social publisher are unchanged.

## Release and end-to-end verification
Before claiming the source fix live: protected PR Required and CodeQL green; main protected merge; exact original Supabase Edge version/source `resolve_goto_urls:true` readback. After deployment, one original authorised `runDate=2026-11-14` request; sourceIntake diagnostics and original immutable winner/ONE BRAIN source occurrence must be independently read.

If no new eligible independent dated source, keep Instagram OPEN with exact rejection causes; do not invent a winner or accept `google.com/goto` as a source. If a new winner exists, only original OpenArt producer with actual funded entitlement + original job CAS may create the required original Mira native 1080×1920, face ≥0.940 and temporal ≥0.900 video, then existing publisher requires independent real Meta account ID/permalink GET and ONE BRAIN consumer PROCESSED ACK. Current connected OpenArt workspace has 0 credits (production key funding scope must be checked independently). Code deployment alone never means daily Instagram publication.
