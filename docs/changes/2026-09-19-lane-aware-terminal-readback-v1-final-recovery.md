# Final recovery for lane-aware terminal readback

The implementation from PR #2330 is already present on protected main. Subsequent fixes aligned the durable `github_main` evidence contract and replay semantics after main advances.

This recovery candidate intentionally adds no runtime feature. It resumes the same canonical obligation from current main so the terminal control plane can produce the missing durable Brain proof, release the writer lease and publish immutable terminal evidence.
