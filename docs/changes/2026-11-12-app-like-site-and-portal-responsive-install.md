# 12 November 2026 — Bedrijfsgeheugen feels like a real business app on phone and tablet

Original Portal V2 parent #4215, original ONE BRAIN/Powerhouse/Heartbeat #4198. Fingerprint: `website|portal|one-installable-app-feel-safe-offline-and-tablet-dock|20261112-v1`.

## Source audit before correction

Original website source `index.html` did not link a PWA manifest. Original `portal-v2/index.html` had responsive CSS and a genuine four-tab canonical mobile dock, but no manifest or standalone app install support. Original `portal-v2/portal-polish.css` hides the sidebar at widths below or equal to 900px; `portal-v2/navigation.css` showed the fixed mobile tab bar only below or equal to 760px. **761–900px tablet portrait thus had no single-tap dock**, losing app continuity. The original public website already owned a single idempotent sitewide mobile menu/slider repair `assets/sitewide-mobile-ui-20261111.js` and injected CSS; no second menu was necessary.

## Delivered bounded code

- Public `/assets/app.webmanifest` installs the public brand (start `/`, scope `/`). Portal `/portal-v2/app.webmanifest` installs a customer-oriented launch (start/scope `/portal-v2/`). Both use canonical full HTTPS links, 192px scalable original-brand triple-dot icon and existing 512px Bedrijfsgeheugen icon. Standalone, brand theme, homescreen title, Apple meta and safe-area viewport on both original pages.
- `/assets/app-sw.js` is one browser-only web app SW for the existing origin. **Only** `/assets/app-offline.html` is cached. Every same-origin GET page navigation is network-first, all API calls, POST, anonymous scan, consent, tenant credentials, Supabase, original Brain/Powerhouse/Heartbeat and dynamic browser content remain uncached and unqueued. Explicit public offline page says no actual business data and no action executed. No false functionality offline.
- `assets/app-standalone.js` registers the single SW, listens to actual eligible native `beforeinstallprompt`, uses user-click prompt or iOS browser Share→Add-to-Home-Screen guidance **inside the existing account popover**. No overlay, new scheduler, app data sync, extra router or private search.
- Existing shared website `assets/sitewide-mobile-ui-20261111.css` gains safe-area, reduced-motion, accessible focus and tactile 48px CTA behavior across the **same** existing site-shell builder; no second mobile menu.
- Original `portal-v2/app-feel.css` makes the **same** four-tab dock visible on 761–900px tablet portrait, using its actual body-mounted DOM location (not a false `.app` descendant), keeps original full canonical menu, increases touch targets and installs subtle, accessible tap feedback/reduced motion. Retains original tenant/routing/Powerhouse state.

## Original owner and regressions

Existing `agent-website-ux` task, `.agents/skills/portal-living-interface/SKILL.md`, `skills/website-portal-coherence.md`, global `AGENTS.md` updated. `brain/learning/2026-11-12-installable-app-and-tablet-original-ux-v1.json` machine prevention, `tests/brain-installable-app-safe-private-20261112.test.mjs` verifies actual manifest scopes/icons, SW public-only cache, source code no duplicate writer, phone/tablet dock, native install gating and source governance. Original required browser, Netlify and portal tests still authoritative.

## Truth and release

This candidate is not proof of native iOS/Android Store-app publication: it is an installable web app surface with real browser/OS conditions. No offline editing, live connector guarantee, stored customer data or autonomous provider effect is claimed. A future independent installed app usability check should compare tap-to-action and task completion on phone and portrait tablet, retain original CRO holdout, and only mark commercial uplift green with provider-linked outcomes.

Acceptance remains protected original CI hygiene/lease, deterministic canonical System Map, Required/CodeQL, exact-current main Netlify READY and independent Portal V2 DOM/readback and existing Website UX browser checks. Preserve original incidents/issues [#4215](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215) and [#4198](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198), keep existing daily Powerhouse executors active, no extra schedule or worker other than narrow browser-only static offline service worker.
