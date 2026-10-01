# Portal V2 navigation simplification

Portal V2 now uses one canonical information architecture. The compact sidebar is the top-level view; the expanded menu is only a deeper view of those same groups. Detail pages preserve their parent navigation context, the sidebar scrolls independently, and internal runtime/agent terminology is kept out of the ordinary customer flow.

During delivery, the PR branch had fallen behind current main and its Netlify deploy preview failed. The same candidate was synchronized with current main and rebuilt. Exact-head preview `6abe4b27e2105d00089a241d` for `dbd8eb01ee19e44031234bfe639f99133377a6eb` is the recovery evidence.

Release rule: merge only after Portal V2 tests, Required test, exact-head Netlify preview and production readback are green. A PR, merge request, queued deploy or main commit alone is not a production claim.
