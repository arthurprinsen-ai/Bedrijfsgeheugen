# Portal V2 responsive experience contract v1

Date: 2026-10-04  
Status: candidate protected delivery

## Change
Portal V2 now has one final experience layer that every current and dynamically rendered surface inherits.

- unified content-width and spacing scale;
- bounded cards, images, canvases and chart containers;
- responsive breakpoints for 1180, 760 and 430 px;
- 44 px touch targets and visible focus state;
- reduced-motion support;
- viewport-safe dialogs/drawers;
- safer tables and long-content wrapping;
- dynamic interaction/media normalization;
- explicit backend contract regression: canonical Portal State, auth requirement and stored=false failure remain authoritative.

## Release truth
This is not considered production-complete until PR checks, Netlify preview/browser evidence, merge, production deploy and production readback are green.


## V2 assurance hardening
The experience contract is now also the machine-observed visual authority. Dynamic charts/visuals are normalized and remeasured after mount and resize. Visual overflow and runtime errors emit a portal-experience signal, while the browser gate verifies six critical customer routes at four viewport sizes: 1440, 1024, 390 and 320 px. Critical navigation/actions must remain at least 44 px high; the gate is not allowed to widen tolerances to hide a structural defect.

The backend contract remains unchanged and explicit: Portal State authentication and fail-closed write confirmation remain the canonical data authority.
