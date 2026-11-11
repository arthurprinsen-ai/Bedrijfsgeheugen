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

## Navigation obstruction audit
The original canonical WhatsApp widget in tools/site-shell/components.mjs uses .bg-whatsapp-contact at z-index 100000, not merely .wa; the new full-width drawer z-index 2050 would still be obscured. Added actual selector to the public menu-open CSS and the same browser gate. This is still the same PR and original build, not a separate executor.

## Published-template owner confirmation — browser red 2026-11-11 13:40 UTC
Second real candidate check on SHA 3fa0c109 also failed 8/8 geometry. Added browser diagnostics proved `owner=v18MobileDrawer`, `parent=BODY`, `canonicalAvailable=false`, `computedTransform=translateX(384.9px)` at 390px width. Earlier belief that the generated V18 pages mount `bgMobileNav` was false: the historical V18 drawer is the actual owner in this production build. Corrected the existing public sitewide CSS to normalize that exact historical drawer to viewport width and position immediately under the 64px fixed header, remove its transform, and suppress its redundant internal close control while the canonical toggle handles closing. New protected browser evidence required; no claims of production success before exact readback.

## Mobile transition and product conversion controls
The real browser job on head a429c63 (run 43031727773) remained red 8/8: after the header was anchored correctly, computed V18 drawer transform was matrix(..., 357-409px, 0), leaving the drawer outside the viewport during its historical open transition. The same original candidate now explicitly cancels animation and transitions on the open full-width drawer. No red gate was bypassed.

The user-supplied mobile Platform screenshot also showed bare underlined hero conversion links. The final money-page transformation adds `.bg-money-order-path` CTA elements after V18 compilation without a correspondingly scoped mobile button style. Added a mobile-only accessible primary/secondary button layout on the existing CSS source, with 48px targets and a browser assertion on `/product` including actual computed style and 4.5:1 primary-button contrast. This affects no tenant/portal pages or credentials. Keep candidate state open until browser and protected checks prove behavior; then independently verify published SHA and route.

## Agent and skill handoff — 2026-11-11 14:24 UTC
Original agent `agent-website-ux` in `platform/agents/agent-team.mjs` now requires real mobile viewport geometry, sticky/CTA browser behavior, and exact production SHA verification. Existing website skill `skills/website-portal-coherence.md` now requires V18-versus-shared menu ownership, one toggle, 320/390px real browser checks, fail-closed CI, canonical learning readback and no parallel executor. Existing `tests/brain-sitewide-mobile-ui-20261111.test.mjs` enforces these projections. Same original PR #5618 and fingerprint.

Proof status: **SOURCE_CANDIDATE / CI_PENDING**. A merged source is not evidence that running agents consumed this skill; require original skill projection and next genuine run evidence. No all-pages or live claim without exact published main SHA, independent production browser proof, and source learning closure.

## Shared Playwright prerequisite reuse — 11 November 2026
The original Required website browser job spent the second attempt at the shared `install-chromium.sh` prerequisite before the first browser assertion. This did not prove either the site repair or a specific npm/apt root cause; installation remained in progress at source inspection. Prior original incident `ci|cross-browser|playwright-181-os-packages-install-30m-timeout|20261105-v1` independently recorded a repeated expensive OS package install in this toolchain. Existing original website screenshot assurance already runs an official pinned Playwright container rather than fresh apt installs.

Same original website PR #5618 now reuses **that established pattern inside the original Required website browser job**: pinned `mcr.microsoft.com/playwright:v1.61.0-noble`, matching `playwright@1.61.0`, no lifecycle scripts, real executable existence and actual headless Chromium launch smoke, then **all unchanged functional browser checks**. No second scheduler, independent browser-publisher, security waiver, simulated screenshots or external production changes. Existing CI tests now require this pattern and one install/package instance. The new provider image tag is published; actual original GitHub-run and browser screenshot evidence remain `EVIDENCE_DUE` until passed.

Attempt 1 source `b238937c3413acc5bdd06f6b6f20baf638602a3d` failed closed after build/browser jobs were cancelled; original attempt 2 was re-run but its browser prerequisite remained active at inspection. These historical runs are retained. This source change starts new exact-head protected tests, not a green replay of previously cancelled runs.
