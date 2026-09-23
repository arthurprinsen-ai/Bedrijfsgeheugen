# Pricing + i18n live proof — 2026-09-23

## Root cause
The pricing interaction runtime on current main is delegated and survives DOM replacement, but English switching still failed because the browser posts to `/api/i18n-translate` while Netlify had no explicit rewrite from that public path to the existing `i18n-translate` function.

## Fix
`netlify.toml` now rewrites `/api/i18n-translate` to `/.netlify/functions/i18n-translate`. The website release lane now executes a real mobile browser proof: yearly billing, run/grow package toggle, lifecycle route toggle, i18n API probe and English language switch.

## Closure
Do not mark resolved until protected CI is green, the change is merged, Netlify production deploys the merged SHA and the same browser interaction proof passes against production.
