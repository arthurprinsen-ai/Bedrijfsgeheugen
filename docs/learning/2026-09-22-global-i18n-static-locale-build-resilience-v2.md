# Static NL/EN routes — production build recovery

Fingerprint: `global-i18n-static-locale-build-resilience-v2`

The architecture remains static locale routes: public pages are built as separate `/nl/...` and `/en/...` documents. The first production attempt failed in the build stage, not in the browser.

The recovery narrows the build to the real public website surface from the sitemap plus essential public navigation routes. Portal trees are deliberately excluded because their content is partly dynamic and has separate confidentiality handling.

Translation work is now sent in smaller batches. A failed batch is recursively split until the failing source string is isolated, which makes transient provider failures far less likely to kill the entire site build while still failing closed if one specific string truly cannot be translated.

Deploy previews now execute the localization stage too, closing the gap that allowed the first production-only failure through.
