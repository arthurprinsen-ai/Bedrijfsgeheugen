# Terminal writer pre-write CAS v1

## Problem
The merge guard already rejected stale `Writer-Lease-Main-Epoch` values, but that happened too late. A stale writer could first mutate the open candidate branch and reintroduce older source, causing repeated exact-head CI restarts and successor churn.

## Structural fix
- `TERMINAL_DELIVERY` now means the candidate branch is content-immutable.
- Pre-terminal branch writes require compare-and-swap on both expected head SHA and captured current-main epoch.
- Any head or main-epoch drift returns `CREATE_SUCCESSOR_FROM_CURRENT_MAIN`.
- Successors are rebuilt from current `main` plus only the still-valid delta; the predecessor is retired instead of rewritten.
- Metadata and readback updates remain allowed on a terminal candidate because they do not mutate code identity.

## Result
Old lease snapshots can no longer be a valid source for rewriting a terminal PR. The failure moves from repeated post-write CI invalidation to a cheap pre-write rejection.
