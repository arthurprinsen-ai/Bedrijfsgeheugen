# Daily blog: recommendation is internal advice, not the topic

**Date:** 28 October 2026. **Status:** candidate, not production-proven until protected delivery and a manual edge deploy with parity run.

Opportunity-driven blogs (DataForSEO and Tavily signals) were written from the internal recommendation text. The model produced articles about the publishing decision itself, with internal wording such as channel gates, scores and canonical-owner checks. The existing reader-ready check only matched a few exact sentences, so the blogs of 25, 26 and 27 October passed; 28 October was held back by the P0 quality gate.

## Bounded implementation
- `BLOG_READER_READY_PROMPT`: the recommendation and brief are internal advice for the publisher, not the topic; no channel gates, scores, CPC, forecast, search volume or publishing decisions.
- `blogReaderReadyViolations`: new `INTERNAL_PUBLISHING_LANGUAGE` (body) and `META_PUBLISHING_TOPIC` (title). A failed check uses the existing revise and repair route.
- No new scheduler, publisher, collector or table. LinkedIn, Instagram and personal selection are unchanged.

## Independent validation
`tests/brain-blog-reader-brief-guard-v1.test.mjs` extracts the real function and prompt from the function source and replays them (3 of 3 green on this branch). After merge the edge function must be deployed by hand (migration drift) with a parity run. The blog of 2026-10-25 is live with internal wording and is not touched here. The next opportunity-driven blog must pass or be stopped before a PR is opened.
