# 2026-09-20 — instagram-mira-winner-selection-v1

- Reconciled open implementation obligation against current production.
- Confirmed Mira-only identity/media gates are already live through PRs #2425/#2427.
- Confirmed missing ex-ante winner lineage remains real: today's recommendation exists but is only suggested, and recent Instagram social_posts were still normalized as carousel.
- Root cause: recommendation selection was duplicated across orchestrator/media router and social normalization inherited experiment recipe metadata.
- Added immutable daily winner table/function.
- Bound winner identity to media job, artifact, decision and publish capability.
- Added social_posts winner columns, winner-format normalization and outcome writeback.
- Updated content loop to freeze winner before media work and materialize the media job from that winner.
- Updated media router to treat winner-derived job format as authoritative.
- No publication success is asserted until exact media/provider production evidence exists.
