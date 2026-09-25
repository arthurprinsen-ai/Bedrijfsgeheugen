# 2026-09-25 — pricing billing aria-selected parity v1

Observed:
- Netlify deploy `6ab69567bb1545a834e39a45`
- production SHA `c1bde3d41551724f7eaa9e2756d817e8c5e9f236`
- exact production identity: success
- pricing production content: success
- production browser proof: failure
- assertion: `yearly billing aria-selected did not become true`

Repair:
- synchronize aria-selected with aria-pressed in inline and rescue billing controllers;
- synchronize active class and root billing state;
- add regression coverage and continuity learning;
- require production browser proof before LIVE_BEWEZEN.
