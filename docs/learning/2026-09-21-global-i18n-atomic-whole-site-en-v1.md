# Whole-site English is atomic

Fingerprint: `global-i18n-atomic-whole-site-en-v1`

Selecting English now means one thing: the full current website document is ready in English before the locale change is considered successful.

The runtime first collects all meaningful visible text and supported user-facing attributes. It resolves translations from deterministic local mappings, cache and the governed translation service. Any unresolved strings are retried individually. Only when coverage is complete are the translations committed to the page and the English locale persisted.

If complete English cannot be produced, the switch is rejected and the prior Dutch state is restored. This prevents the mixed-language state that was visible in earlier production screenshots.

Coverage includes ordinary text nodes, option text, placeholders, titles, ARIA labels, image alt text and submit/button/reset labels.
