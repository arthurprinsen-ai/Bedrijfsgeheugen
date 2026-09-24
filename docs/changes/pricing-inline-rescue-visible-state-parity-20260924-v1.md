# Pricing visible-state parity — 24 September 2026

The canonical production browser proof on deploy `6ab5115c43b127000874bc90` / SHA `ed982f21e7f903f58a39417a852c9f255d53f372` found the real pricing interaction defect:

`loss stage panel after click is not visible`.

The page had two controllers for the same state. The rescue runtime already wrote both `hidden` and inline `style.display`; the inline pricing controller changed only `hidden`. That allowed contradictory DOM state: `hidden=false` while `style.display='none'`.

The repair makes the inline controller mirror the rescue controller for lifecycle and plan-group state: `hidden`, `style.display`, `aria-hidden`, active class and keyboard tabIndex all move together. The production verifier also waits for the rescue runtime readiness marker before clicking.

The release is not complete until the canonical Production Release Readback passes the actual pricing clicks and NL→EN route transition.
