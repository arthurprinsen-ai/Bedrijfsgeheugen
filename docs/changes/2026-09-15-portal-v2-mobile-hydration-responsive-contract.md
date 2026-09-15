# Portal V2 mobile hydration responsive contract

**Fingerprint:** `portal-v2-mobile-hydration-responsive-contract-v1`  
**Scope:** `/klantportaal` → Portal V2, mobile shell, global actions, hydrated customer cockpit  
**Status:** release-gated; production proof is mandatory after merge

## Incident

On an iPhone-sized viewport the portal first showed the compact initial shell and then, after asynchronous Portal V2 hydration, changed into a second layout in which search/actions expanded vertically. The late-mounted global actions (`Export`, `Import`, `Print`, `Feedback`, `Klantmerk`, account) were desktop utilities and could turn the mobile header into a wall of full-width buttons.

This was a post-hydration regression: a static screenshot or pre-hydration DOM check could be green while the actual internet frontend became unusable shortly afterwards.

## Root cause

`global-actions-ui.js` injects its own stylesheet and mounts `.v2utilities`/`.v2globalstatus` after initial page execution. Shared shell styles were therefore being applied after the first render. Mobile geometry was not a separately enforced contract, so the late state could override or fan out controls even though the first paint looked acceptable.

The authenticated/customer cockpit can also intentionally replace or hide transient initial-shell content such as the static KPI strip. Tests must therefore validate the fully hydrated final state, not assume that pre-hydration demo content remains visible.

## Permanent implementation contract

`portal-v2/mobile-responsive.css` is a critical stylesheet and MUST load before `app.js`. On `max-width:760px` it owns the mobile shell geometry. Critical layout rules use narrow-scope `!important` only where required to protect against styles injected after hydration.

Required mobile invariants:

- no horizontal page overflow;
- search remains one row: flexible search input plus three 40–48 px controls;
- `.v2utilities` and `.v2globalstatus` are hidden in the mobile header; their capabilities remain reachable through the mobile More hub;
- the primary AI and period actions remain 40–48 px high and usable on small screens;
- bottom navigation is fixed and respects `env(safe-area-inset-bottom)`;
- mobile cards, grids and Brain flow collapse without viewport overflow;
- the final hydrated state is the release authority, not the initial paint;
- a browser screenshot of the hydrated mobile frontend is retained as CI evidence.

## Regression tests and evidence

The canonical browser contract is `tests/integration/portal-v2-mobile-shell.spec.js` at a 390×844 viewport. It waits for the asynchronous global actions to mount, waits an additional hydration window, then captures `artifacts/portal-v2-mobile-overview-demoai.png` before assertions so a failing run still preserves what the frontend actually rendered.

The test fails closed when any of these regress:

- desktop utilities visible in the mobile header;
- search controls wrap into separate full-width rows;
- top header becomes abnormally tall;
- primary mobile actions exceed the compact control-height contract;
- horizontal overflow appears;
- browser page errors occur.

`.github/workflows/portal-v2-live-preview.yml` runs this test against the exact Netlify deploy-preview SHA. `.github/workflows/portal-v2-production-dom-readback.yml` runs the same hydrated test against the deployed production site after a main-branch change. Both workflows retain browser evidence; production proof, not merge state, is the definition of done.

## Prevention / operating rule

Never approve a Portal V2 mobile change from source inspection, unit tests, or first-paint screenshots alone. For every shell/global-action/customer-cockpit change:

1. verify exact-head deploy preview;
2. execute the hydrated 390×844 browser contract;
3. retain the screenshot artifact even on failure;
4. merge only after the relevant gates are green;
5. execute production DOM/browser readback on `www.bedrijfsgeheugen.nl`;
6. record merge SHA, production run and screenshot evidence in Powerhouse runtime/learning lineage.

If the initial shell and hydrated cockpit legitimately contain different content, that difference is not itself a failure. Layout instability, unusable controls, overflow, or untested post-hydration rendering is a failure.

## Incident learning

A mobile page is not proven responsive until its *late state* has been observed in a real browser. Async UI mount points are part of the visual dependency graph and must be included in responsive release gates. This rule applies to future Portal V2 controls and dynamically injected styles as well as the current global actions.
