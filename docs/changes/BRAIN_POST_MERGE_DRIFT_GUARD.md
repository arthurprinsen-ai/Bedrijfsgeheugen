# BRAIN post-merge drift guard

Canonical regression for the delivery handoff race where a feature head can already be contained in `currentMain` by the time the moving-main guard executes.

Invariant: when the tested feature head is an ancestor of current `main`, the handoff must treat the candidate as already integrated. It must not derive feature-vs-main overlap from the merged main tree and must not emit `SYNC_REQUIRED` for paths or contracts that came from that same feature.

Fingerprint: `brain-post-merge-drift-head-already-integrated-v1`.
