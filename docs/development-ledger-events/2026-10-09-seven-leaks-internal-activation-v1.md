# Append-only development event: seven-leaks internal activation (2026-10-09)

- Fingerprint: `powerhouse|revenue|seven-leaks-internal-activation|v1`; existing commercial P0 #4198.
- Observed: protected-merged offer PR #4284, exact Netlify production source `bc994bac` ready. One first-party page visit on `/7-bedrijfslekken` observed; no paid revenue/scan conversion attributed. Existing LinkedIn company OAuth write lacks organization publishing permission; do not fabricate external posting.
- Repair: Homepage and free selfscan gain a **tertiary** internal link to the existing PDF offer; separate source UTM values, one shared wording and one canonical NL-to-EN translation cache patch. No new runtime, campaign or scheduler.
- Expected proofs: protected website tests, locale and mobile parity, production SHA and native-link readback, real visitor clicks and downstream orders. Missing post/deploy/outcome means no commercial green.
