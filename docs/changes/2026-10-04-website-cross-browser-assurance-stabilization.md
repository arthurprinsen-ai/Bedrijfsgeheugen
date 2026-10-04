# Website cross-browser assurance — runner stabilization

The production cross-browser assurance remains fail-closed for real rendering defects, but now waits through short canonical/i18n document replacements before measuring. Browser-internal cancelled requests such as `net::ERR_ABORTED` and Firefox `NS_ERROR_ABORT` are not treated as broken site assets when the final document loads normally.

This preserves the structural checks: all sitemap routes, responsive mobile/desktop rendering, Chromium/Firefox/WebKit critical screenshots, navigation interactions, CLS, horizontal overflow, broken images, page errors and failed non-benign document/script/stylesheet requests.
