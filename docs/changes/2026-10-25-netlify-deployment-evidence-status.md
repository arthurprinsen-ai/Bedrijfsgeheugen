# Netlify deployment evidence classification

## Incident and cause
PR #4924 altered CI workflow, System Map, tests and docs without changing deployable website/runtime paths. The existing Netlify impact classifier and `build.ignore` correctly allow skipping production builds. Release reporting compared current Netlify SHA to latest main without checking applicability and falsely labeled this a deploy failure.

## Bounded implementation
Add `classifyNetlifyDeploymentEvidence` to the existing Netlify applicability module. Emit `NOT_REQUIRED` for governance-only changes, `PENDING` for required deployments that are not ready or SHA-matched, `UNKNOWN` for missing or explicit-skip evidence, and `SHA_MATCHED` (not full production proof) for required deploys with matching provider identity. Four regression tests cover these cases. No new workflow, scheduler, or provider write.

## Proof boundary
This draft is a pure classifier; dashboard/agent integration and production proof are not yet complete. Required and CodeQL must succeed on the exact PR head before protected merge. A governance-only release does not need an artificial Netlify build; a runtime change requires provider and runtime verification.
