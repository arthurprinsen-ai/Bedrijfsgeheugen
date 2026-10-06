# Development ledger — Netlify exact-tree build reuse v1

- Date: 2026-10-06
- Obligation: netlify-build-artifact-reuse-20261006-v1
- Baseline: real Netlify build/deploy work remained roughly 69–117 seconds after CI fan-out was removed.
- Root cause: the same deterministic site build was repeated in Required and production; build commands were duplicated across three control points.
- Cache identity: exact Git tree SHA, not branch name or mutable cache label.
- Reuse authority: successful Required run associated with the merged PR + exact current-main tree equality.
- Production reuse: prebuilt tree + identity-only Netlify command; provider packaging/functions and production readback stay intact.
- Fallback: any missing/mismatched artifact uses the canonical source build.
- Parallelization: only independent pricing/bedrijfslek capture and restore phases run concurrently.
- Regression: tests/brain-netlify-build-artifact-reuse-v1.test.mjs.
