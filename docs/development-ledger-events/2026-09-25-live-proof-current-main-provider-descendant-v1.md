# Development ledger — live proof current-main/provider binding

- Date: 2026-09-25
- Obligation: `live-proof-current-main-provider-descendant-v1`
- Base main: `390e058e581874cb08f5b2d4608d886a5c9a7dcf`
- Classification: delivery governance / terminal proof
- Change: added permanent Powerhouse rule requiring fresh current-main and provider-production identity readback before `LIVE_BEWEZEN`.
- Historical evidence: Netlify production deploy `6ab65252fc750c000816160b` was `ready` on exact commit `63ab5bff7780bfb3ff6d5fa1f1d96eada7ae2cea`; prior merges #2846 and #2848 were proven ancestors.
- Prevention: stale merge/deploy evidence may not be reused after main/provider movement.
