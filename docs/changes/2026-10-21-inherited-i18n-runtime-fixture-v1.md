# BRAIN inherited i18n build-transformer baseline repair

Obligation: `ci-inherited-brain-i18n-runtime-fixture-20261021`. Parent [#3742](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/3742), portal dependency [#4573](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4573), existing full-failure run [39554866582](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39554866582).

## Exact failure and cause
The unmodified main reproduces 355 BRAIN failures. A contained subset of inherited i18n tests asserted retired literal syntax (`MOBILE_LANGUAGE`, `html.replace(existing,mobileLanguage)`, or `injectMobileLanguage(html)`) even though the real current transformer uses `mobileLanguageFor(file)`, the callback form and `injectMobileLanguage(html,file)`. The pricing source assertion incorrectly expects runtime build assets to already exist in the pre-transform file.

## Fix and prevention
The same contract tests now execute the **real** transformer from `tools/site-shell/apply-i18n.mjs` twice on a newly created disposable HTML root, then assert partial and complete CSS/JS retention, exactly one language navigation element, NL/EN route preservation, compact CTA insertion, existing-nav replacement, and byte-for-byte idempotence. Pricing uses the actual `prijzen.html` source, verified **after** the canonical transform, preserving a real source-to-output check. The helper deletes its temp directory; it never edits production input files. Source syntax checks remain on the compact CTA test.

Scope is test-only plus governed skill, Brain learning, System Map and append-only ledger. No migration, protected CI workflow, production code, provider config or runtime authority changes. Retain all 355 baseline failures until the exact full BRAIN run proves otherwise. #4587 owns a separate manual-workflow assertion; #3763 owns historic SQL reconciliation. No duplicate writer.

## Release condition
A targeted execution is not complete protected acceptance. Required CI, CodeQL, exact-head BRAIN, protected merge and subsequent production readback remain mandatory. Genuine authenticated two-customer portal input acceptance remains independently open in #4215.
