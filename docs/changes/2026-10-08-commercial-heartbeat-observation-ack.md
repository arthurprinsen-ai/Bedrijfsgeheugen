# Powerhouse commercial heartbeat: durable observation without a false sales claim

## Root cause (production, 2026-10-08)
Protected PR #4114 and production migration deployed an evidence-based daily commercial assurance function. It correctly reports `commercial_day_proven=false` when there are no provider IDs, but the Heartbeat incorrectly included `output_assurance.healthy` in its **transport/durable-readback** health gate. The one allowed Netlify -> Supabase Edge runner requires `data_quality=VERIFIED` and event state `observed`/`actioned`/`done`. Under safe zero-output, the old Heartbeat wrote `error/PARTIAL`; the runner then rolled its transaction back, creating a false retry loop and a missed five-minute receipt.

## Single-owner recovery
The existing SQL Heartbeat now distinguishes verified *measurement and delivery control* from *actual commercial output*. The runtime regression gate and strict assurance contract/date/boolean/state validate observation completeness. On an intact no-send day it emits a durable **observed/VERIFIED** event; never `actioned`. `commercial_day_proven` and the Brain `COMMERCIAL_EXECUTION` obligation remain **false/OPEN** until exact Gmail or social provider proof. A malformed assurance, unhealthy regression gate or real transport failure still fails closed.

No new cron, duplicate sales executor, credential, sender, status spoofing, direct user contact or revenue claim. Preserve existing internal-only SQL function EXECUTE boundary and Netlify schedule `2-57/5 * * * *`.

## Evidence and promotion
Existing production: 2026-10-08 08:07 UTC latest commercial heartbeat, output assurance v2, and at 08:14 UTC output assurance v3 had zero proven actions and `healthy=false`; regression gate run under the authentic `powerhouse.external_heartbeat_owner=netlify-supabase-edge-v1` returned `healthy=true`. Thus the false connection was isolated. Protected CI, official Supabase preview, protected merge, production migration and next **natural** Netlify scheduled event with `observed/VERIFIED` and `commercial_day_proven=false` are required for closure. An isolated SQL-only validation is not a substitute for the natural scheduled run.

## Recovered migration replay authority · 8 October

Official Supabase Preview on this PR exposed `Remote migration versions not found in local migrations directory`. Production `supabase_migrations.schema_migrations` was queried **read-only**, including the original SQL statements. Four exact, non-placeholder migrations were restored on this same protected candidate under their actually applied production versions: 20261008073832, 20261008073907, 20261008080905 and 20261008080913. This is a source-control correction only, not a modification of production, not an assertion of provider preview success, and not an instruction to forge migration history. The Identity Graph and provider-proof baselines already exist in additional earlier/later repository versions: both remain idempotent under replay. The regression suite now fails if these historically applied migration source files disappear again.

Closure is contingent on **native provider-owned Supabase Preview success on the exact current PR SHA**, protected Required and CodeQL, merge, production ledger and a naturally scheduled observed/VERIFIED heartbeat; neither source parity alone nor a manual SQL dry run counts as a commercial send.
