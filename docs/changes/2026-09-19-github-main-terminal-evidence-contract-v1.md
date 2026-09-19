# GitHub-main terminal evidence contract

The durable terminal-evidence consumer now supports the `github_main` readback mode emitted by lane-aware terminal closure.

For automation-only changes whose production surface is protected GitHub `main`, the consumer requires a valid observed commit SHA and `production_readback_verified=true`. It records the evidence as `github-main:<sha>`. Website or runtime changes continue to use canonical production-run or descendant-live evidence.

This closes the producer-consumer contract gap that caused terminal closure run 35436438329 to return HTTP 422 after production readback itself had already succeeded.
