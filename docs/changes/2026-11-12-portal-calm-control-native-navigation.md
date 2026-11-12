# 12 November 2026 — calm, customer-controlled Portal V2 app

Fingerprint: `portal|ux|one-home-quick-control-search-original-router|20261112-v1`.

## Existing interaction and diagnosis
The original Portal V2 already had a verified-tenant entrepreneur home hero, with one next-step action, and a collapsed secondary overview. The hero also always rendered the five-stage dark interactive decision map; this made a daily action feel like a full dashboard before the user could simply check their data, action queue, result or ingestion status. The visible header search was not wired to the canonical navigation, forcing users to know the long menu. These problems are UX friction, not missing customer data or justification to recreate the application.

The inspiration is the *interaction model* of Revolut 10 / Revolut Business RB5 (simple home, tasks one tap away, control and clear levels), not copied brand UI, colors, names, logo or assets.

## Minimal implementation on original source
- Keep the existing authenticated `entrepreneur-home.js` primary next action from `buildEntrepreneurHomeModel` exactly once. Move the existing real decision-map DOM to the existing `eh-advanced` disclosure; no duplicated flow or dropped route.
- Add read-only four secondary control targets via `daily-controls.js`: Gegevens (`ingevulde-gegevens`), Acties (`actieve-acties`), Resultaat (`outcomes-evidence`), Verwerking (`brain-verwerking`). Each displays the actual business source/evidence status from the **same authenticated principal** and original `EntrepreneurJourneyModel` and `pendingHandoffs`; an old Brain ACK is NOT green if a current handoff is pending. Self-reported scan does not imply audited financial performance; no unverified lead/order/ROI.
- Wire the existing topbar input to `quick-switcher.js` using the original `listPortalGroups` metadata, `isProtectedTrustPage`/`hasProtectedTrustAccess`, and `navigatePortal`. Keyboard Ctrl/Cmd+K or /, Escape, arrows, Enter, accessible listbox with no private customer search. Reset input when principal changes. No new query API, index, route, schedule, localStorage or duplicate menu.
- Add touch-ready responsive and reduced-motion CSS in `daily-controls.css`. All code is DOM-element creation + `textContent`, no user-generated `innerHTML`, and no external script.
- Update original Website UX agent, Portal Living Interface skill, AGENTS.md and Brain learning. Exact regression in `tests/brain-portal-ease-quick-control-20261112.test.mjs`. Distinguish code/test success from measured user experience or commercial results.

## Release and limits
Publish only through original protected Required/CodeQL, auto-merge, production exact-current SHA Netlify and original Portal V2 DOM readback, never through a direct code or provider bypass. No new Supabase source writer. Before real authenticated tenant/role mobile task test and observational time-to-task comparison, do not claim Revolut UX parity, Red Dot award worthiness or measured conversion improvement. Keep original owner issue https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215 and commercial issue https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198 open for those product and outcome proofs.
