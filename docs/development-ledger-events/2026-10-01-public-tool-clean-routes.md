# Public tool clean routes — 2026-10-01

Production readback showed that the new package-advisor and portal-demo CTA destinations were not reliably reachable through their clean URLs even though the HTML files existed in the repository.

Recovery:
- /pakketadvies rewrites to /pakketadvies.html;
- /portaal-demo rewrites to /portaal-demo.html;
- the backing pages remain unchanged;
- production acceptance now requires direct readback of both clean URLs.

This is a routing correction, not a content redesign.
