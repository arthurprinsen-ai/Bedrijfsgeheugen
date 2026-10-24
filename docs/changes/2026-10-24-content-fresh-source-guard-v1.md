# Fresh external source guard for daily brand content

The existing Powerhouse content orchestrator ranks externally sourced commercial recommendations. One 24 October 2026 recommendation pointed to a June 2020 government document but had an October 2026 crawl timestamp. A fetch date is **not** evidence that the underlying market event is current.

For source-backed recommendations asserting current market/news/search intent, source selection now requires a defensible original publication date within 180 days and a source observation within 14 days. A missing date or aged original document blocks *currentness* promotion; previously prioritized stale pinned recommendations can fall back to an existing same-channel candidate. Generated briefs follow the accepted candidate, and any fallback is kept in canonical artifact generation evidence. Old evidence may be used only as expressly historical context, not silently reported as current.

The existing blog/LinkedIn publishing, editorial, consent and protected CI gates are unchanged. Measurable next-post decisions remain under existing proven-only guards. No new scheduler, data store, sender, or false revenue claim. Confirmation requires protected merge and exact Supabase provider source plus next publication/outcome readback.
