# Growth runtime reliability and Decision Twin prerequisites — 19 October 2026

## Why this is part of one product
A trustworthy Decision Twin cannot learn from actions if the observation delivery queue repeatedly times out or duplicates provider side effects. Rather than adding another autonomous scheduler, this candidate hardens the existing Powerhouse growth replay.

## Production evidence (before)
- Source: Netlify Observability, `bedrijfsgeheugen` site, trailing 24h measured 19 October.
- HTTP 499: 1,316 / HTTP 204: 1,422 on `/.netlify/functions/growth-drain`; ~15s p99. Some 499 requests have later logs confirming 10 persisted events, so 499 means observer disconnect, not necessarily ingestion failure.
- Code: `growth-drain.mjs` starts 10 replay cycles, `growth-replay.mjs` lists the full Blob store for each scheduled invocation. Each replay can entail up to three sequential HTTP-bound steps.
- External docs: https://docs.netlify.com/build/functions/scheduled-functions/ and https://docs.netlify.com/build/data-and-storage/netlify-blobs/.

## Change in this lineage
A fixed bounded runtime guard, paginated lazy traversal, alternate outcome/event priority, and persist-once disabled-delivery skip. Only a verified provider receipt authorizes `delivered`. Clock budget has a safety margin, not an absolute deadline on an I/O already in flight. No second SSOT, polling framework or publication bypass.

## Follow-on roadmap, not delivered by this change
1. Confirm provider-result idempotency under truly concurrent scheduler invocations; if not proven, introduce an authorized durable Postgres claim/lease rather than relying on Blob consistency.
2. Instrument backlog count and oldest pending age, separated by event/outcome, with tenant-safe dashboard projections; define throughput/99p SLOs.
3. Connect real tenant historical metrics to the existing Decision Twin scenario flow with per-source quality, calibrated forecast, intervention, receipt, measured counterfactual and learning.
4. CMS requires editorial publication workflow; its existing draft rows do not mean published content.
5. Validate against competitors on measured end-to-end customer outcomes; knowledge graphs and agents by themselves are established functionality (Fabric IQ and Palantir Ontology).

## Release rules
Do not claim a permanent timeout fix from code or a green deploy alone. Production monitoring must show the result and safety must be maintained if external services slow down again.
