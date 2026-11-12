# One business app across site and Portal V2 — 12 November 2026

Original owner: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215
Commercial owner: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
Fingerprint: `portal|website|one-installable-business-app-responsive-touch-with-no-private-cache|20261112-v1`

## Diagnosis (original code, not a fabricated UX measurement)
Portal V2 source `app.js` already mounts the one native four-target `portal-mobile-primary`, but its stylesheet `navigation.css` only makes the dock visible below 760px. At 761–1180px the main sidebar is hidden by `portal-v2/app.css` and the user is thrown back to a hamburger rather than the same direct app experience. The existing public website has its own tested canonical sitewide mobile header and menu, but no shared installable web app identity or one-tap public entrypoints for Scan, Prices and My Company. The existing #5634 PR was protected + production-readback verified; preserve it.

## Correction in originals
- `app.webmanifest`: one first-party app ID, same branded launch to `/portal-v2/`, manifest 192x192 original PNG, existing 512x512 PNG and original vector maskable icon. Standalone browser mode and existing customer login; never a fake native App Store app.
- One `assets/bg-app-experience.js/css` document enhancement: on public pages only, native four full-URL anchors for Discover, Scan, Pricing and My Company with 44px+ targets, safe-area, current item and reduced-motion. Existing menus remain sole owners. Installation button only when real `beforeinstallprompt` is supplied by browser; iOS uses native 'Add to Home Screen' functionality, no fake prompts.
- No second data loop: the sole root `bg-app-sw.js` is **network-only navigation** with a generic 503 offline screen. Does not cache any page, customer information, credentials, API, tenant context, results or outcomes, and has no scheduled sync or background task. Offline *customer operations are not claimed*.
- Original public `tools/site-shell/apply-cms-runtime.mjs` publishes this common app shell once across all site pages including nested public pages; excludes portal/auth paths. Original `portal-v2/index.html` references the same manifest and app enhancement. Original Portal V2 router and four canonical app targets unchanged; stylesheet `portal-v2/app-device-shell.css` extends them to tablet widths with layout/safe-area, iOS form input no-zoom and reduced-motion.
- Original Website UX agent, `.agents/skills/portal-living-interface/SKILL.md`, `.agents/skills/seo-revenue-growth/SKILL.md` and global `AGENTS.md` updated to demand cross-device readback. No Revolut logo/branding or copied assets.

## Release evidence and limitations
Source and tests: `tests/brain-single-installed-app-mobile-tablet-20261112.test.mjs` (manifest true icon dimensions, no caches/credentials, original builder idempotence, guest and original portal isolation, tablet CSS) and `tests/integration/portal-v2-website-one-app-phone-tablet.spec.js` (real public phone/tablet navigation on exact deploy). Preserve all previous required mobile/portal/Powerhouse checks. Exact original System Map and app.js cache stamp must match protected generated source in any integration.

This is a protected candidate until GitHub Required, CodeQL, portal parity, builder source and real production readback green. Source changes do not prove measured user adoption, retention, task completion, commercial conversions, successful two-tenant external connectors or Heartbeat learning; those remain `EVIDENCE_DUE` under original #4215/#4198.

App value proposition: **Je bedrijf. Eén app. Elke dag grip.** The interface should feel calmer and quicker than a traditional management dashboard but must prove its effect with privacy-respecting first-party measurements and real customers.

## 12 november — tablet 1024px dubbele navigatie bronoorzaak en regressiepreventie

Code review van originele Portal V2 op exact app-kandidaat: `portal-v2/portal-polish.css` gebruikt op 901–1180px `.sidebar{display:flex!important}` en `.app{grid-template-columns:210px minmax(0,1fr)!important}`, terwijl de nieuwe app-device-shell op 761–1180px de **oorspronkelijke** vier-tab `.portal-mobile-primary` zichtbaar maakt. Deze twee presentatie-eigenaren veroorzaken bij 1024px een ongewenste dubbele navigatie. **Oplossing binnen dezelfde originele PR #5644**, zonder nieuwe router of schrijvers: hoger-specifieke `html body .app/.sidebar/.portalview` responsive override alleen op 901–1180px, met werkende oorspronkelijke route- en tenantcontrole. Playwright `tests/integration/portal-v2-website-one-app-phone-tablet.spec.js` toetst aanvullend de echte 1024px browser: bestaande vier tabs, verborgen oude sidebar/hamburger, >900px hoofdruimte, nul horizontale overflow, open/sluitbaar originele Meer-overlay, nul JS-fouten. Dit is een bescherming tegen UX-regressie, **geen bewezen real-user usability/conversie of livegang** zolang Required, CodeQL en onafhankelijke Netlify/DOM-readbacks niet geslaagd zijn.
