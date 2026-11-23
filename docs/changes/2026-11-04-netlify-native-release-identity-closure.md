# Netlify native release identity — production recovery candidate

Original owner: canonical GitHub/Netlify production delivery. Incident: #4447. PR #5425.

## Incident
Netlify production builds exited with `PRODUCTION_RELEASE_IDENTITY_UNAVAILABLE` while deployment metadata omitted `commit_ref`. This is a production release provenance issue, not permission to disable the release gate.

## Source correction
`tools/ci/netlify-build-entry.mjs` now reads verified `git rev-parse --verify HEAD` if `COMMIT_REF` is missing, rejects malformed or contradictory supplied commit identities, retains mandatory production `CONTEXT` and `DEPLOY_ID`, and records non-secret presence flags when identity cannot be established.

## Acceptance
Run Required, CodeQL, original Netlify parity and regression checks; merge only through protected policy; require READY Netlify deploy, exact SHA readback from `/release.json`, and mobile browser verification. **Not live proven.**
