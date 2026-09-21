# English selected but Dutch copy stayed visible: locale race

Fingerprint: `global-i18n-locale-epoch-race-v1`

The translation service was not the only failure mode. The browser runtime also invalidated in-flight English translations whenever any second translation pass started. On a dynamic page, DOM changes can trigger another pass before the first provider request finishes. The first result was then discarded even though the visitor had not switched language.

The runtime now uses a locale epoch. It increments only when the visitor changes between Dutch and English. Same-locale refreshes no longer cancel each other.

Canonical menu and authentication labels also have a deterministic local English fallback. This means key navigation copy changes without depending on a remote AI response, while the provider remains responsible for the rest of the page content.
