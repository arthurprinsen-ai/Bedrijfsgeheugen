# Bounded canonical Growth Intelligence writeback — 2026-10-23

## Observed production truth
Netlify production released PR #4817 at commit `591dcc4f893f3d2dcfb5b30a0014f82c9e3e62a7`, with `growth-intelligence-daily` scheduled at 06:00 UTC. On 23 October the old build returned three 502s with `growth intelligence store configuration missing`. The fix in PR #4817 was deployed only after that daily window; no new successful schedule run is yet proven. `brain_records` still had its last Growth Intelligence scorecard on 13 September. The provider caps scheduled functions at 30 seconds; the daily source has dozens of sequential write calls per qualified market/company.

## Implementation
- Reuse the existing scheduled `growth-intelligence-daily.mjs` and existing canonical Supabase tables, instead of another scheduler, analytics store or queue.
- `createGrowthDailyBatch` coalesces same-natural-key writes per `table+on_conflict` during **one** invocation, limits upserts to 40 rows, and performs independent table batches concurrently.
- Due obligation/learning PATCH operations remain keyed by their original exact records; no cross-tenant broad update, no RLS/policy change.
- A completed daily handler **must await** its real PostgREST writeback. On 4xx, 5xx or timeout, fail closed so the existing failure recovery remains active.
- The existing `REJECTED_WITH_EVIDENCE` optimization state remains truthful until a separate protected source change and live readback are proven. This technical change does not claim an actual CRO test or sale.

## Verification to close
1. Existing historical Brain test, scheduled-run integration regression, new batching/dedup/fail-closed regressions.
2. Latest SHA Required, CodeQL, Netlify preview/build, protected merge to main.
3. Exact published Netlify commit plus a **new daily 06:00 UTC production invocation** producing a durable and readable `growth-intelligence-scorecard-YYYY-MM-DD`.
4. Continued SEO/GSC, behavioral CTA/lead, and actual paid outcome evidence. No fabricated green status or 0→positive outcome claim.

## Engineering rule
Batching is a performance and reliability tactic; the durable authority stays in Supabase. An in-memory buffer is never a persistent queue, and a PR check cannot substitute for next-day runtime readback.
