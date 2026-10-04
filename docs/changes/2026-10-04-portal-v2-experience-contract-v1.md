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
