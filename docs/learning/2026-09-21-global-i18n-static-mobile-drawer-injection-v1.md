# Static NL/EN selector in the canonical mobile drawer

Fingerprint: `global-i18n-static-mobile-drawer-injection-v1`

The mobile language selector is now inserted during the final site build into the canonical V18 mobile drawer. This removes the previous dependency on discovering the correct drawer variant after page load.

The selector is inserted before the login action when that action exists. JavaScript still owns language state, translation, persistence and delegated clicks. Runtime mounting remains only as migration compatibility.

This change was triggered by a production screenshot on 2026-09-21 that still showed the complete V18 menu without a language selector after two runtime-only mounting fixes.
