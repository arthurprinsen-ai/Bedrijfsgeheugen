# 2026-11-12 — Site + Portal V2 native-feel phone/tablet original-owner app UX

Fingerprint: `website|portal|standalone-app-native-phone-tablet-one-navigation|20261112-v1`
Parent issue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215
Commercial related issue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

Root source observation: existing website mobile menu and sitewide builder, but no native-like four-task nav and no installable web manifest; Portal four-tab dock only on phone, not tablet. Public builder wasn't refreshing already injected inline CSS or script version. Existing secure tenant state/Brain handshake remains original and was not inspected as an actual user session.

Correction: same source asset/script, idempotent append one public app dock with original real HTTPS routes; existing final public CMS builder refreshes a single inline mobile CSS+versioned script and includes full-URL web manifest/iOS metadata only on public pages. New public and portal manifests have isolated ids/scopes. Reuse same Portal V2 authorized dock at 761–1024px with presentation-only CSS, no new navigation authority or tenant data writer. No cache of auth/customer/API data or offline promise.

Browser replay: original `tools/site-shell/sitewide-mobile-interaction-browser-check.mjs` now covers 320, 390 and 820px and actual app dock route geometry alongside old menu/sticky/contrast checks; `tests/integration/portal-v2-mobile-shell.spec.js` original route/menu/role/overflow checks also at 820. Exact Node regression `tests/brain-public-portal-standalone-app-20261112.test.mjs`, and previous two original sitewide build tests updated, plus full inherited Portal V2 tests. Failure → original owner + root cause + only protected correction, never bypass tests.

Release evidence currently: **CANDIDATE / NOT YET VERIFIED LIVE**, awaiting original protected PR checks, main current Netlify release, independently measured public/mobile/Portal V2 readbacks. No asserted install success on physical iOS/Android, no offline readiness or conversion/award outcome. Keep original automated executors unaffected.
