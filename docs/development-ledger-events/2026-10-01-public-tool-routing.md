# Public tool routing recovery — 2026-10-01

The package advisor and interactive portal demo already existed in the accepted website tree, but the clean customer URLs were not explicitly owned in Netlify routing.

Recovery:
- /pakketadvies -> /pakketadvies.html (200 rewrite)
- /portaal-demo -> /portaal-demo.html (200 rewrite)
- regression remains covered by the canonical website coherence suite

Production closure requires merge, Netlify production deployment and live readback of both clean URLs.
