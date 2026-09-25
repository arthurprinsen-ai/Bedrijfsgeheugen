# 2026-09-25 — Static i18n partial-cache route isolation

Observed production state:
- exact-main deploy and locale routing were operational;
- /en/prijzen reported lang=en and data-bg-static-locale=en;
- data-bg-static-translated=false;
- first H1 remained Dutch;
- final Playwright production gate failed with: English route still shows the Dutch pricing H1.

Root cause:
- one or more cache gaps anywhere in the public build caused the static-English generator to discard all cached translations globally in offline mode.

Permanent correction:
- retain and apply cached translations in offline mode;
- isolate missing strings per route/text node;
- report route gaps;
- preserve truthful translated-state metadata;
- keep three-route browser proof as terminal release authority.
