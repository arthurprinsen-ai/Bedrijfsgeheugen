# 2026-09-24 — pricing inline/rescue visible-state parity

Observed production:
- SHA: `ed982f21e7f903f58a39417a852c9f255d53f372`
- Netlify deploy: `6ab5115c43b127000874bc90`
- route /prijzen: 200 desktop and mobile
- page errors/assets: clean
- interaction failure: loss stage panel remained invisible after click

Root cause:
dual pricing controllers applied different visibility state. Rescue wrote inline `display:none`; inline controller did not clear it when activating a panel/card.

Repair:
- make inline lifecycle state identical to rescue state;
- make inline plan-group state identical to rescue state;
- wait for `ready-v3` runtime marker before production click proof;
- preserve canonical browser gate as terminal authority.
