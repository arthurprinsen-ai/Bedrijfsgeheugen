# Lane-aware terminal readback

Terminal closure is now evidence-specific to the production surface that actually changed.

For automation-only changes, when the merge contains no Portal V2, public/src runtime, Netlify function, or Supabase function/migration paths, the workflow treats the repository's protected `main` branch as the production surface. It proves that the merge commit is contained in current `main` and records `github_main` as the readback mode.

Changes touching deployable runtime surfaces continue to wait for canonical production release readback or the existing descendant-live fallback. This removes unnecessary polling delay without weakening runtime evidence.
