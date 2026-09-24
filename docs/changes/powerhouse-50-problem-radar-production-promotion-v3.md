# 2026-09-24 — Problem Radar exact-main production promotion v3

Fingerprint: `powerhouse-50-problem-radar-production-promotion-v3`

## State before promotion

- protected main: `9a9778d4284d7b1df491e0fffea7c3df3ac30167`
- Netlify production: `ready`, `production`
- provider commit_ref: `bbb6ec5841eca4880d77ce0d09c6da458f7302b1`

The feature is already present in production ancestry, but exact-current-main equality is not proven.

## Promotion

The only deployment authority used is the existing canonical `Production Source Snapshot`.

This candidate changes its operational refresh marker so the protected-main merge triggers an exact-source snapshot/deploy for the resulting main SHA.

No product code and no alternate deployment authority are introduced.

## Completion

Terminal proof requires Netlify provider readback:
- state = `ready`
- context = `production`
- commit_ref = current protected main
- non-empty deploy id

Only then may exact-main production be marked `LIVE_BEWEZEN`.
