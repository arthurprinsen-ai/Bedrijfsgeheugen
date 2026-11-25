# Full BRAIN verification on main without additional workflows

The previous verification-only main dispatch of Unified Brain Delivery failed before tests (run 40218283550) because its planner expected PR base metadata. Instead of growing the 123-workflow control plane, extend the existing `.github/workflows/brain-foundation-verify.yml` with a manual trigger, a checked-out SHA assertion, full `scripts/brain/test-all.mjs`, and uploaded immutable test output. This job has contents:read only and no deployment rights. The legacy push trigger remains unchanged.

Passing this PR does not imply 376 old test failures have disappeared. After protected merge, manually dispatch the existing workflow on exact main and inspect its independent result.
