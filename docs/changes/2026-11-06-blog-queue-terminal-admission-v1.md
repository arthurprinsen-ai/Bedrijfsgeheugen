# Original blog queue — terminal no-publish admission (2026-11-06)

## Observed defect
On independent Supabase readback, 4 and 5 November blog obligations were GENERATED with dead canonical URLs. The existing official publication skip function safely closed those entries as SKIPPED/NO_PUBLISH. However the original authenticated `powerhouse-blog-queue` checked only the source artefact's publish decision and a date *syntax* check; it did not check the obligation's terminal no-publish status or that the requested day matched the local Amsterdam business day. It could return `queued: true` even when the authoritative `record_content_publication_state(GENERATED)` rejected that downgrade. This was a false queued acknowledgement, not evidence of publication.

## Single-writer fix
Add one **pure** admission guard inside the **original** `powerhouse-blog-queue` after the same original Supabase reads and before any lineage mutation or decision evidence write. Guard against (1) an old or future business date, (2) `SKIPPED` or explicit `NO_PUBLISH`, (3) active editorial veto, and (4) dispatched/published/live/learned states or any external provider side-effect evidence. Existing same-day, unsent blogs continue through the existing authorization, approval, official-date, canonical slug and protected GitHub publisher routes. No new cron, executor, writer or OAuth bypass. Human review remains necessary to override an explicit veto.

## Regression and proof boundary
`tests/brain-blog-queue-no-publish-20261106.test.mjs` covers the historical SKIPPED dates, veto variants, side effects, safe same-day flow and source integration order. Protected Required CI and CodeQL, original Supabase deploy, exact live function source readback, and the next natural publication are distinct evidence stages. A blocked historical article must **never** be counted as a delivered publication. Never claim tomorrow live before provider ID, URL and independently retrieved page agree.
