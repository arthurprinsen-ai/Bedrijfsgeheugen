# P0 #4215 — prevent false portal success on uncommitted BusinessInput

## Observed root cause
The existing Portal V2 browser `savePortalBusinessInput` helper accepted any successful HTTP status as durable success. The existing server handler can return HTTP 200 with `stored:false` and `stale:true`, or an incomplete acknowledgement, after prior Brain append stages. A browser caller could then issue a separate `/api/portal-state` write despite lacking proof of canonical persistence. This is a real client-side fail-open defect, not evidence that historical customer data was lost.

## Change
- Reject incomplete HTTP-200 business-input receipts unless `stored===true`, `stale!==true`, `authorityStored===true`, `powerhouseFeedStored===true`, and `organismImpactStored===true`.
- Preserve the existing single `/api/portal-business-input` authority and `/api/portal-state` projection; no new DB, scheduler, or Brain.
- Prevent any follow-on portal projection write on an incomplete canonical receipt.
- Preserve explicit failure for the existing non-2xx server errors.
- Add seven independent failure fixtures (uncommitted, stale, missing authority, missing Powerhouse, missing impact, partial, empty) to the existing browser persistence test.

## Reproduce / verify
`node --test portal-v2/tests/portal-business-input-persistence.test.mjs tests/portal-business-input.test.mjs tests/portal-business-input-powerhouse-feed.test.mjs`

## Boundaries
This patch establishes a fail-closed client predicate; it does not prove any real customer's authenticated portal write was received and persisted. P0 #4215 remains open until two independently authorized customer tenants prove actual write→ONE BRAIN→impact→roadmap reload, field coverage, transaction durability, and individual CSRD/ESRS applicability. Never count CI fixture tenants as live customer evidence.
