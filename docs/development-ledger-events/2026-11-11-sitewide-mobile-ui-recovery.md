# Website mobile interaction recovery — 2026-11-11

- Obligation: `website|mobile|header-menu-slider-interaction-and-cta-contrast|20261111-v1`.
- Owner: existing public website GitHub → original Netlify pipeline, not a second executor.
- Intake evidence: five iPhone screenshots show mobile header not consistently sticky/aligned, white-on-white secondary CTA, non-working menu close, knowledge slider only reachable below the visual comparison, and user-reported non-clicking controls.
- Root cause: multiple public header/menu generations, overflow-x:hidden sticky interference on Safari, conflicting CTA CSS, and visual slider hit target separate from the native range.
- Fix: one final-build public CSS+JS repair, explicit independent menu close with state/scroll reset, sticky header, computed white-on-white contrast safety, one native 0–100 range over knowledge comparison, readable mobile panels.
- Isolation: authenticated Portal V2 and original commercial/tenant/Powerhouse executors unchanged. No second scheduler.
- Regression: `tests/brain-sitewide-mobile-ui-20261111.test.mjs`, `tests/site-shell-mobile-ui-recovery-20261111.test.mjs`, `tests/site-shell-mobile-sitewide-recovery-20261111.test.mjs`, existing full-sitemap cross-browser assurance with new close/sticky/slider checks.
- Admission failure #43015777977: `INTEGRATION_BUNDLE_CLOSURE_INCOMPLETE:activity_ledger,brain_learning`; add the original learning and append-only ledger in the same candidate, then re-run without weakening gates.
- Current outcome: **candidate only / evidence due**. Never claim live, fully working or Red Dot-ready before protected merge, exact Netlify READY and independent iOS/desktop readback.

- Aanvullende first-time-right controle: bij PR-browsercontrole bleek de algemene 277-routes × 3-viewport sweep niet afzonderlijk de nieuwe klik-, sluit- en kennisvergelijkingscontracten te bewijzen. De **zelfde** beschermde website-lane voert nu een concrete Playwright-interactietest uit, inclusief keyboard/touch en CTA-contrast. Bewijs wordt in de bestaande workflow als artifact bewaard. Deze nieuwe browserpoort is niet hetzelfde als onafhankelijke productie-/iPhone-readback.
