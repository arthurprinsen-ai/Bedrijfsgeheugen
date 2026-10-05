# Production locale verifier state contract

Date: 2026-10-05

The production pricing/i18n verifier previously coupled locale proof to Playwright's classical navigation event. The live language switch can complete through client-side routing, so a valid switch to `/en/prijzen` could time out even when the English route and content were correct.

The verifier now activates the same visible mobile language control and proves the resulting canonical pathname together with `document.documentElement.lang`. Existing translated-content, pricing, route round-trip and deprecated-`/nl/*` assertions remain in place.

This changes only the verification mechanism; it does not weaken the production contract or alter the public language behavior.
