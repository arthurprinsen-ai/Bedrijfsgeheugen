# GitHub-main terminal evidence

The durable control-plane evidence API now supports multiple verified production readback modes instead of assuming every delivery ends in a website deployment workflow.

For `canonical_run`, a positive GitHub production workflow run ID remains mandatory. For `github_main`, the API requires `production_readback_verified=true` and requires the observed SHA to equal the merged main SHA. This allows GitHub/automation control-plane changes to close terminally without fabricating a website deployment identity.

The chosen mode, observed SHA and verification state are persisted into Brain evidence. Invalid modes, missing verification or mismatched GitHub-main SHAs fail closed.
