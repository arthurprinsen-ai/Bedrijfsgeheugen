# User screenshot regression / single navigation 2026-11-11
Parent: PR #5613 SHA acd84d42b58da6dd8de95f93fa8aba82f8e4b467. New iPhone screenshots showed extra floating close button, exposed background strip, off-axis header/menu sheet and obscuring WhatsApp. Original pass asserted only aria and toggle, not mobile geometry.

Root cause: V18/legacy mobile header position and a second close control, with a fixed menu affected by ancestor coordinate systems.

Recovery: retain original menu engines; move mobile menu sheet to body; fix header during open; align full-width menu beneath measured header; remove duplicate close control; suppress floating WhatsApp and non-essential mobile ticker; reduce duplicate-hamburger visual confusion; maintain hero touch target.

Proof: existing website lane browser asserts 320/390px viewport geometry, header adjacency, no side gaps, no secondary close, real touch/keyboard and /product route. No portal/auth changes, no bypass. Exact Netlify READY/main SHA and independent readback mandatory before marking LIVE.

## CI incident recovery — 2026-11-11 13:16 UTC
First PR #5618 admission rejected machine metadata because freeform prose put Delivery-Lane, Candidate-Type and Base-SHA on one paragraph and omitted Obligation-ID. Original protected gate correctly failed and skipped downstream tests; no bypass. The PR was corrected to the canonical multiline metadata block and synchronized with this ledger-only source commit to request a new genuine PR event with the corrected event payload. Prevention: future PRs must use canonical multiline metadata at creation, before checks start.

## Canonical learning closure (2026-11-11 13:18 UTC)
Admission metadata fixed, then the protected integration closure required a brain learning record. The same PR now adds this record and its historical replay test; no check was bypassed. Each previous failure remains traceable.

## Real mobile geometry red gate — 2026-11-11 13:26 UTC
The actual 320/390px browser gate failed **8/8** on original candidate SHA 1354e973: measured menu left 335/408px, right 636/775px, and top 0 even though the fixed header ends at 64px. No production promotion; the gate was correctly red. These values match the historical 94vw V18 drawer parked to the right of the viewport. The legacy V18 menu-state observer still assigns mobileToggle aria-controls to v18MobileDrawer while the accessible bgMobileNav drilldown is available. Recovery stays in PR #5618: make aria-controls point at the one visible canonical menu, suppress the legacy drawer when canonical exists, and add diagnostic menu ownership to the browser gate. Await new real browser and protected checks, then exact production readback; no waiver.
