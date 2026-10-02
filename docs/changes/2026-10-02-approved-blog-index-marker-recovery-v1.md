# Approved blog index marker recovery — 2026-10-02

The canonical approved-blog publisher failed on the 2026-10-02 exact slug because `blog/index.html` currently stores a literal `\\n` after `<div class="artikelen">`, while the deterministic updater only accepted a real newline.

The recovery keeps the publisher fail-closed. It accepts only the two equivalent, explicitly known representations of the same articles marker. It does not use fuzzy insertion, does not alter approved article copy, and does not bypass protected delivery.

Terminal acceptance remains: required checks pass, merge to main, exact blog URL is publicly readable, canonical/content identity matches, and Powerhouse publication/outcome reconciliation records the provider/public proof.
