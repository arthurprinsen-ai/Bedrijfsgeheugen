# Pricing runtime build preservation — 24 September 2026

Production deploy `6ab5131f10d7810008497634` contained exact SHA `e648f6c8e07bc2185daab6c71b0adff26d020d68`, but the canonical production browser proof timed out waiting for `data-bg-pricing-interactions="ready-v3"`.

The repository source did contain the pricing rescue runtime. The production build pipeline, however, runs V18/full-page transforms before `pricing-build-integrity restore`. That restore only restored `#pakketten`; the inline pricing controller and rescue script live outside that section and could therefore disappear from the final built page.

The repair makes pricing build integrity own the complete pricing runtime contract:
- restore canonical `#pakketten`;
- restore `script#bg-pricing-neno-v1-js`;
- ensure the versioned `pricing-interactions-rescue-v1.js?v=20260924-0750` tag;
- fail the build if either runtime is absent afterward.

Production browser proof remains the terminal authority.
