# First-party activation for De 7 verborgen bedrijfslekken

Canonical parent: [P0 #4198](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198). Original approved offer [PR #4284](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4284); exact production source `bc994bacb40725f70930e2a85a22e357b3f6cf5c`, deploy `6ac935afd365540008bcb39d`.

## Existing-state-first problem and repair
A useful free PDF without audience distribution will not generate qualified pipeline. The live `/7-bedrijfslekken` landing was not linked from the existing `/` and `/zelfscan`. The original feature avoided modifying the selfscan when the required protected NL/EN string cache would have been incomplete.

This change adds exactly **one tertiary text link** from each existing high-intent page, preserves every existing primary CTA and existing scan behavior, and offers a **direct, ungated, SEO-safe downloadable PDF** (`/assets/downloads/7-verborgen-bedrijfslekken.pdf`) on both pages. This avoids linking from indexable pages to an HTML landing not present in the canonical SEO route registry. The existing privacy-aware `bg_interacties` click event carries the source page path (`/` or `/zelfscan`) and the PDF target, preserving genuine attribution without query parameters. The existing `/7-bedrijfslekken` landing remains independently available to external campaigns. The direct download stays ungated. Add only the one required translation key through `config/bg-static-i18n-en.d/2026-10-09-seven-leaks-internal-activation.json`. Do not defeat the i18n guard, add duplicate hero campaigns, create a parallel executable or send a prospect message.

## Conversion measurement
The existing `assets/meting.js` tracks attributed first-party page and click interactions subject to current privacy controls; the existing `/zelfscan` supplies diagnostic value; later appointment, paid scan or subscription order and realized revenue must be separately provider-confirmed. Analytics readback must distinguish **observed**, **not yet observed**, **unknown** and **blocked** from new conversion. The first pageview proves only a pageview.

## Acceptance/rollback
Protected PR admission, scoped translation and browser checks; exact SHA Netlify production, mobile/desktop PDF download-link readback and first-party page-scoped link-click event. Rollback removes only the two tertiary links and their scope-specific translation patch. The original PDF/scan/checkout continue to work. P0 #4198 remains OPEN pending actual paid revenue to verified ONE BRAIN learning.
