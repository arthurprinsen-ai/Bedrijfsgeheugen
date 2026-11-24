# Approved blog innovation delivery ledger

Original candidate `3b1d5796-46fe-4053-b57a-e7c2ef4aa955`, operation `8cf97b71-4706-4e20-96a5-3f9945f5720b`, owner `agent:agent-integration-engineer`, source revision `2026-10-09T03:02:00.367007+00:00`.

The historical replay failed before the edit with None in place of the expected fresh slug. The first response contained an existing article and a continuation cursor that the queue reader discarded.

The source fix in `scripts/brain/publish_approved_blog_v2_core.py` follows queue cursors with the original filters and sort. It fails on missing or repeated continuation cursors. Forced lookup stops once two matches establish ambiguity. Unforced reads collect the remaining pages, so larger queues can require additional reads.

Contract testing and champion challenger compared the correct-selection count on the same synthetic queue. The first-page reader scored 0/1 and the cursor-following reader scored 1/1. The local shadow fixture exercised exact-slug reconciliation and checked that the article bytes were preserved and the result was SEALED. Evidence is in `tests/brain-innovation-approved-blog-stale-pagination.test.mjs`.

Revert the core pagination change through existing_protected_delivery (required). Delivery status is `CANDIDATE_NOT_LIVE`. Protected review is required. Original consumer acknowledgment, production readback and independent Heartbeat effect remain due.
