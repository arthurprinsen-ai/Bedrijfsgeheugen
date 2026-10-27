# 25 October 2026 — Fair daily market-source collection

The existing external intelligence collector used absolute 20-minute epoch slots. When triggered at the same wall-clock time daily, the cursor advanced by 72*3 modulo the 44 active topics. Its greatest common divisor is 4; that can leave 11 topics without selection indefinitely.

In production 44 topics are active; 3 have never produced stored source records, 6 have no records in seven days and only 1 admitted source has a publication date within the latest seven days. Missing items may also reflect provider responses; the queue defect is separately reproduced by a deterministic regression.

The correction uses one existing bg-externe-signalen Edge producer, the same service token, Tavily-first and independent DataForSEO fallback, the same three-topic bounded budget and canonical source observation. It rotates the start point by UTC day plus 20-minute within-day slot, so a **static** 44-topic set completes within at most 15 daily calls. Topic additions/reordering and external API responses can affect real coverage; never equate attempted search with obtained trustworthy records.

The source observation now records selection contract, day/slot and static fairness horizon. No new scheduler, database queue, second CRM, duplicate sales action or invented revenue.

Delivery: exact-head Required with five negative/positive tests, CodeQL, protected merge, Supabase Edge deployment, actual subsequent collector run and independently observed topic coverage.
