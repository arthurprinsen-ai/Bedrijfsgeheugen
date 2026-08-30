# Portal native legacy batch 9 — production outcome

Status: PRODUCTION_GREEN

- PR: #273 (PR #272 was closed only because the connector's ready-for-review GraphQL mutation failed on `fullDatabaseId`; the exact same head was reopened non-draft).
- Candidate: `f4e439d636ae7f24afee2d334cc74115103247a8`
- Merge commit: `57ea61eabf6fd235d5d453492405e2f493697d00`
- Native workspace: `openen`
- Production deploy: `6a93ec8a10b9ec0008aa42a7`
- Netlify state: `ready`
- Redirect rules: 75, no errors
- Header rules: 16, no errors
- Functions: 7
- Edge functions: 1
- Secret scan: 0 matches

Safety contract: import is parse/validate first, preview-only until explicit confirmation, supports canonical v4 and legacy v1 backups, preserves the current state until the server write succeeds, and accepts completion only after the imported `sourceMeta.importId` is read back from `/api/portal-state`.

TDD evidence: the RED contract failed because `openen` was absent from the native set and `parsePortalBackup` did not exist; the parser/preview GREEN run passed malformed/unsupported rejection, v4 acceptance without source mutation, v1 compatibility and change preview checks.

Reusable lesson: a deployment/build status is not import outcome evidence. For state-replacing operations, stage locally, require explicit user confirmation, write once, then verify a deterministic idempotency marker by read-back before switching the client from last-known-good.
