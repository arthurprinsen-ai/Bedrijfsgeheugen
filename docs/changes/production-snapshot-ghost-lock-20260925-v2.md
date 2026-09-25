# Production snapshot ghost-lock recovery v2 — 25 September 2026

The recovered `production-source-snapshot-main-v2` concurrency group developed a second stale scheduler lock. Run `36162423347` remained `in_progress` on old main `0e6a879c…`, while newer exact-main snapshots stayed pending.

The recovery rotates only the concurrency-group identity to `production-source-snapshot-main-v3`. `cancel-in-progress: false` remains unchanged, so production writes are still serialized. This does not bypass protected delivery and does not permit concurrent deploys.

Terminal proof remains unchanged: latest protected `main` must equal Netlify `commit_ref`, followed by green NL/EN browser readback.
