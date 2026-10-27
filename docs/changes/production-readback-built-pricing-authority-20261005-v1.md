# Production readback built-pricing authority — 5 October 2026

## Trigger

Current main `47ad59de1694409902bedc4d2395a80296b7a375` was live with an exact release marker, but Canonical brand shell live readback failed because the pricing verifier expected source-authoring attributes that the production build intentionally rewrites.

## Canonical production truth

The live pricing build exposes:
- navigation anchors `href="#saas"` and `href="#expertise"`;
- sections `id="saas"` and `id="expertise"`;
- SaaS packages Starter, Pro, Groei and Enterprise;
- consulting propositions including Build Sprint and Transformation / Fractional Lead;
- package-advice controls `pkgSize`, `pkgGoal`, `pkgMode`, and `pkgGo` linking to `/pakketadvies`.

## Correction

`tools/site-shell/live-contract.mjs` now validates that built production DOM directly. The exact release SHA, trust shell, mobile navigation, contact placement, cross-page shell parity and retired pricing-contract rejection remain fail-closed.
