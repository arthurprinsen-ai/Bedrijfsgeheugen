# Commercial outbound eligibility after pressure filtering — 8 October 2026

## Verified production failure
The daily business record remains `degraded` (15 recorded actions; 16 recommendations), **not 15 delivered messages**. Canonical `powerhouse_commercial_output_assurance_v1('2026-10-08')` independently proves two external publications (company LinkedIn + public blog); it proves **zero individual e-mail sends**. Verified LinkedIn publication is not proof of delivery into a named prospect's inbox.

The existing revenue command-center snapshot had 609 records. All 20 of its globally first-ranked entries were `cooldown`; 24 entries with `low`/`medium` contact pressure existed at lower ranks. `powerhouse_materialize_command_center_actions_v1` erroneously applied `revenue_rank <= 20` **before** applying the legally and operationally required contact-pressure, cooldown, confidence, identity and lineage gates. Therefore the bounded materializer selected no candidate. The Gmail account preflight passed, but the canonical outreach executor observed `selected=0; sent=0; errors=0` while writing misleading health `ok`.

## Minimal fix, one existing owner
- Keep the same Powerhouse materializer, ranking and dedupe-key calculation. First apply the **unchanged** eligibility, pressure, identity and lineage predicates to the revenue snapshot, **then** `ORDER BY revenue_rank ASC LIMIT 20`. Contacts on cooldown remain excluded; lower ranked candidates may now enter the existing preparation path.
- The existing `powerhouse-autonomous-outreach` Edge function returns an explicit `delivery_gap` and records `waarschuwing` if zero e-mails have provider-confirmed IDs, even when the run is technically successful. A returned provider ID is evidence of provider acceptance only, not guaranteed inbox placement.
- No new scheduler, provider, queue, token, contact enrichment service or delivery-evidence store. Do not bypass human approval, recipient pressure, suppression, channel capability, quality checks or send idempotency.

## Verification and exclusions
- `tests/brain-commercial-pressure-rank-and-outbound-proof-v1.test.mjs` covers filter-before-cap semantics, cooldown non-bypass, SQL service-only ACL and zero-send warning.
- Protected Required, CodeQL, official Supabase Preview, protected merge, production SQL + Edge function readback and natural scheduler outcome are mandatory for terminal delivery.
- This branch does not claim 24 newly reachable candidates can be contacted: they may be routed to source research if no auditable LinkedIn post or e-mail recipient is available. If none is addressable, the business-level receipt count remains zero and the delivery gap stays open.
- The separate daily-run guard correctly remains `degraded` while publication, predictive and other execution gates remain incomplete; it must not be overridden to green because a blog was posted.

## Acceptance
On the same source population, the new selector must not be starved by the first twenty cooldown records; provider outbound sends, if any, must be separately evidenced by exact message IDs. A warning must remain visible when actual recipient-provider sends are zero.
