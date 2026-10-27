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

## Terminal production proof
- Status: **LIVE_PROVEN_RUNTIME / LIVE_BEWEZEN**
- Delivery PR: #3683
- Candidate head: `a21b9b961bedf9840a69fad5ff9059c8f6643196`
- Protected main: `d5abf46b5f86a65720fd2cf2d454116f696e8c45`
- Netlify production deploy: `6ac253953b573d0008e8e31a` (`ready`)
- Production portal: https://www.bedrijfsgeheugen.nl/portal-v2/
- Required test: run `37205339277` — success
- Portal V2 Production DOM Readback: run `37205339123` — success
- Portal Visual Density: run `37205339124` — success
- Powerhouse CodeQL: run `37205339174` — success
- Obligation Terminalizer: run `37205519609` — success
