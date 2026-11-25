# Protected English translation source parity — 11 October 2026

The canonical blog publication generator prepared English translations only after SEO and UI transformations. The protected PR preflight incorrectly compared those translations against raw pages, producing five apparent missing entries on the new Twinfield API article. The cache itself had valid translations for the transformed source.

The preflight now invokes the approved production transform entrypoint with STATIC_I18N_NETWORK=0 and STATIC_I18N_REQUIRE_CACHE=1 **before** applying its existing second fail-closed validation. This changes neither editorial rules, translation requirements, security controls nor the blog writer. It prevents false CI failure from inconsistent source corpora.

Parent: P0 #4198. Source: .github/workflows/required-test.yml. Test: tests/brain-protected-i18n-source-parity.test.mjs. Protected checks and actual release remain mandatory.
