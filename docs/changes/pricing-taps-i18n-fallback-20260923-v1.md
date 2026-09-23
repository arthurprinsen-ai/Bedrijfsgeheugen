# Pricing taps + English fallback — 2026-09-23

Two production symptoms shared a client-delivery weakness: pricing controls rendered but did not reliably respond to iPhone taps, and the language selector could navigate to an English route that an offline release had not generated.

The pricing page now loads an external delegated controller that handles lifecycle, package-direction and monthly/yearly controls through capture-phase click handling plus touch pointer fallback. This does not depend on a single inline initialization moment.

Localized builds now always write both Dutch and English route trees. If the static English translation cache is unavailable during an offline release, the English document is emitted with `data-bg-static-translated="false"`; `i18n.js` then translates that route in place through the existing translation endpoint.

Closure requires preview/browser interaction gates and exact production readback for both `/prijzen` and `/en/prijzen`.
