# Bounded fair revenue-learning reconciliation

Parent [#4445](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4445); obligation `netlify|revenue-learning-evaluate|bounded-fair-reconcile|20261023-v1`.

## Measured root evidence
Netlify production request `01M5MDK5YSNXA4R7XW25EVZ5EV` POST `/.netlify/functions/revenue-learning-evaluate` on 2026-10-23T13:00:53Z returned HTTP 502 in 4.846 seconds. Netlify function log reported `Revenue learning store TimeoutError: Signal timed out. (503)`. Supabase function-edge log actually recorded POST `/revenue-learning-store` HTTP 503 at 13:00:57.870Z. A previous catalog query found 340 executed `powerhouse_sales_actions`. Source at Supabase Edge version 115 re-read the oldest 50 and ran 50 RPC requests sequentially each hour. The causal exclusivity of the timeout is not established by one request.

## Change (no second infrastructure)
A single service-role-only **SECURITY INVOKER** Postgres RPC ranks executed actions by their existing `sales-action:<uuid>:outcome` obligation `updated_at` (missing first, then oldest). It performs at most 20 of the **existing canonical per-action** reconciliation routines in one database transaction; a SQL error rolls that batch back. Each reconciliation continues updating the same three obligation types, never a second store or scheduler. The existing Edge function calls this one RPC and checks the receipt and canonical tenant. `remaining_review_required=true` signals that more actions exist; it does not mean those actions have no receipts, and `selected=20` does not imply measured revenue. The existing Netlify hourly evaluator remains unchanged.

## Release sequencing and evidence
1. Protected exact-HEAD Required and JS/Python CodeQL; negative SQL privilege and no-third-scheduler tests.
2. Existing Supabase owner: apply migration **first**, verify `anon=false`, `authenticated=false`, `service_role=true` EXECUTE for the new RPC and service-role batch behavior in controlled safe tenant scope. Do not issue a live replay without source/side-effect guard.
3. Deploy matching Edge source via existing owner, verify deployed code/version/hash. Keep Netlify original hourly schedule, no duplicate manual invocations.
4. Read actual provider request status, 502/503 counts, and successive distinct source actions from the existing obligation table; validate at least the executed 340-action inventory receives eventual bounded passes without fake evidence. Compare before/after comparable invocation cohorts for latency, error rate, backlog age.
5. If migration not yet present when Edge code arrives, typed 503 is a **blocked incomplete release**; restore original Edge version via standard rollback, never mark green.

This candidate is not live customer-value proof. Missing customer authorization, tenant-specific actual outcomes or observations remain UNKNOWN and block production acceptance.
