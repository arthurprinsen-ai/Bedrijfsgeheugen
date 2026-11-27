# 12 Nov 2026 — unified public & Portal V2 app shell, original owner

Fingerprint: `portal|website|one-installable-business-app-responsive-touch-with-no-private-cache|20261112-v1`
Parent issue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215
Commercial outcome: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

**Observed baseline:** protected original #5634 Portal V2 phone UI live and production-DOM verified. Tablet CSS kept same four-route nav hidden above 760px while sidebar also hidden under 1180px. Public pages had canonical mobile menu, but no PWA installation manifest or native direct bottom-dock. These are observable app navigation/integration UX defects, NOT proof of low conversion or an incomplete real tenant source.

**Remediation:** one original app.webmanifest/bitmap icons/vector icon; network-only, no-cache, no-sync service worker with static offline info; a single public responsive app dock (real HTTPS hrefs) and conditional real browser install action; existing public CMS-site-wide injector covers all public pages; existing Portal V2 four native authorized routes gain tablet size; iOS safe area, focus, reduced-motion, no form autozoom; original agent, two skills, global AGENTS; source and browser regressions. No new business store, executor, external connector, provider action, or fake business result.

**Security:** no private page/API cache, storage, background sync, analytics duplication or cross-tenant claims. A PWA wrapper is not a bank or native App Store app. No tenant data is available offline.

**Release:** require protected Required and CodeQL, exact-main Netlify current ready, independent portal DOM and original skill projection. Real-world installation/revenue/usability measures NOT_YET_PROVEN; preserve original obligations #4215/#4198 as EVIDENCE_DUE.

## 12 november — tablet 1024px dubbele navigatie bronoorzaak en regressiepreventie

Code review van originele Portal V2 op exact app-kandidaat: `portal-v2/portal-polish.css` gebruikt op 901–1180px `.sidebar{display:flex!important}` en `.app{grid-template-columns:210px minmax(0,1fr)!important}`, terwijl de nieuwe app-device-shell op 761–1180px de **oorspronkelijke** vier-tab `.portal-mobile-primary` zichtbaar maakt. Deze twee presentatie-eigenaren veroorzaken bij 1024px een ongewenste dubbele navigatie. **Oplossing binnen dezelfde originele PR #5644**, zonder nieuwe router of schrijvers: hoger-specifieke `html body .app/.sidebar/.portalview` responsive override alleen op 901–1180px, met werkende oorspronkelijke route- en tenantcontrole. Playwright `tests/integration/portal-v2-website-one-app-phone-tablet.spec.js` toetst aanvullend de echte 1024px browser: bestaande vier tabs, verborgen oude sidebar/hamburger, >900px hoofdruimte, nul horizontale overflow, open/sluitbaar originele Meer-overlay, nul JS-fouten. Dit is een bescherming tegen UX-regressie, **geen bewezen real-user usability/conversie of livegang** zolang Required, CodeQL en onafhankelijke Netlify/DOM-readbacks niet geslaagd zijn.
