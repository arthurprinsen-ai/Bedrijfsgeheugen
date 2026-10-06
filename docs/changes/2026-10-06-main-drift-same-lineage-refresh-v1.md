# Same-lineage main-drift refresh — 2026-10-06

Terminal pull requests that are already green but fall behind a fast-moving `main` are now classified as `MAIN_DRIFT_RECOVERY` instead of healthy progress.

The recovery supervisor refreshes the existing same-repository candidate only after proving an exact terminal writer lease, an immutable captured main SHA, a valid merge base, and zero changed-path overlap. It merges that exact main SHA into the existing branch, advances the Base-SHA and writer-lease metadata, and consumes the bounded recovery budget.

This prevents repeated successor PRs while preserving exact-head validation, protected merge, security gates and post-merge readback.
