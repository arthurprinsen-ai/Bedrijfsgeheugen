# 2026-10-01 — Final visual pixel polish

- Obligation: `final-visual-pixel-polish-20261001`
- Delivery lane: website
- Scope: pricing geometry, canonical header height, empty-shell spacing, Portal V2 responsive model containment.
- Root cause: visual geometry was not fully encoded after content, routing and proposition parity had already been completed.
- Prevention: explicit breakpoint rules plus regression assertions.
- Candidate: PR #3567.

## Verification follow-up

- Production readback: 14/15 portal browser tests passed before the mobile-shell contract caught topbar height 287.34px (>260px).
- Root cause: the <=430px `portal-polish.css` action-row rule loaded after the mobile shell and forced a one-column stack.
- Correction: retain `minmax(0,1fr) auto` action geometry at <=430px.
- Preview contract: replaced stale “Het brein van je bedrijf” grep with canonical “Zo werkt Powerhouse in je bedrijf”.
- Regression hygiene: product-truth test now scopes legacy-copy assertions to the rendered product block.
- Follow-up candidate: PR #3568.

## Replay assertion closure v2

- Candidate: PR #3573.
- Correction: repaired the template-literal regex and replaced obsolete `pr-hero` / `const hero` assertions with the current `mainStart` / `firstSection` insertion contract.
- Purpose: keep learning canonicalization fail-closed without false negatives from stale implementation details.

## Final mobile cascade correction

- Visual evidence: 390px viewport still measured topbar 287.34px.
- Root cause: `.actionrow` remained `display:flex!important` from `topbar-actions.css`; grid-template alone had no effect.
- Correction: explicitly set `display:grid!important` at <=430px, with AI and Periode in the same row.
- Verification contract: `tests/integration/portal-v2-mobile-shell.spec.js` requires topbar <260px after async hydration.
