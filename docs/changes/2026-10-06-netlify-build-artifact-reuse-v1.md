# Netlify exact-tree build reuse — 2026-10-06

## Problem
Required already executes the exact production build before merge, while production deployment executes the expensive build again. The same long build pipeline also existed independently in Netlify production, Deploy Preview and Required.

## Structural fix
- One canonical build runner owns the full production transformation sequence.
- Only two proven independent integrity phases run in parallel; overlapping HTML writers stay ordered.
- Required caches prebuilt output by exact Git tree SHA and uploads a short-lived immutable artifact.
- Production may reuse that artifact only after a successful Required run for the merged PR and exact equality with the current main tree SHA.
- A reused artifact executes only release-identity stamping in Netlify so COMMIT_REF, DEPLOY_ID and HTML release markers remain production-correct.
- Missing, expired or mismatched artifacts fall back to the existing exact-source production build.

This removes duplicate deterministic work without weakening exact-SHA production proof or provider readback.
