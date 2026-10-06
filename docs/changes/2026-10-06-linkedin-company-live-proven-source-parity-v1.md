# LinkedIn company LIVE_PROVEN source parity

Date: 2026-10-06  
Obligation: linkedin-company-live-proven-source-parity-20261006

## Observed escaped defects

The company publication itself is already provider-created and terminally verified. The remaining defect is repository/runtime drift.

The recovery exposed four independent resumability bugs:
- the company publisher compared the fresh OAuth account to an old hardcoded LinkedIn person id instead of the setup controller's provider-verified `personal_author_urn`;
- the same daily uniqueness reservation rejected typographic/URL-shape differences even when the canonical normalized content hash was identical;
- an expired, unconsumed five-minute publication capability remained behind the unique day/channel fence;
- LinkedIn normalizes presentation (including URL shortening/escaping), so raw commentary equality rejected a provider post whose canonical normalized text was exactly identical.

## Structural parity

This candidate pins the repository to the production-proven authorities:
- `powerhouse-composio-linkedin-setup` v23;
- `powerhouse-content-loop` v31;
- `powerhouse-social-publisher` v115.

It also records the production-proven database semantics as a forward idempotent migration:
- same reservation key + exact same normalized hash is an idempotent resume;
- changed normalized content remains blocked;
- expired + unconsumed capabilities are automatically revoked before reissue;
- consumed capabilities remain the hard same-day side-effect fence.

Provider readback remains strict: exact post id, exact organization author and lifecycle `PUBLISHED` are mandatory. Commentary may differ only if both sides resolve to the exact same canonical normalized text; there is no fuzzy match.

## Terminal evidence

The existing company post is `urn:li:share:7513196691630575616`.
Canonical evidence now proves provider create, acknowledgement, exact provider truth, fresh organization OAuth, organization-admin proof and verified organization-write capability. The publication obligation is `LIVE_PROVEN`.

No republish is permitted or required.
