# Development ledger — terminal Brain gate trigger parity

Date: 2026-09-25
Obligation: `governance-production-trigger-ownership-v1`
Supersedes: PR #3108 terminal-evidence defect

## Evidence
- PR #3108 exact-head Required: success.
- PR #3108 exact-head Powerhouse Skill Projection: success.
- PR #3108 exact-head Powerhouse CodeQL: success.
- Merge SHA `c47d5728b99ecc90b6644c6add57a8a590cea970` Brain foundation verify run `36175492186`: success.
- Obligation Terminal Closure run `36175492847` remained blocked because it queried Unified Brain Delivery with `event=pull_request`.

## Root cause
Terminal evidence demanded an impossible trigger/event combination.

## Repair
Use trigger-compatible exact-head Unified Brain evidence when present, otherwise exact-merge Brain foundation verification.

## Prevention
The new Brain regression test asserts workflow-trigger parity and fail-closed exact-SHA evidence.
