# 2026-11-20 — CI_RED — dagelijkse blog met kleine letter in titel

- **Signal:** PR #6060 (daily blog 2026-11-20): `preflight` rood op `brain-blog-seo-focus-pronoun-20261108` (title starts lowercase), `test` daardoor rood.
- **Root cause:** `seo_title` plakt het kleine-letter zoekwoord voor de suffix en kapitaliseert niet; de generator was nooit gedekt voor dat pad.
- **Fix:** hoofdletter op de eerste letter van elke geretourneerde titel plus een eigen test. Zoekwoord-extractie ongewijzigd (werkwoord "klaarmaakt" als zoekwoord blijft een open kwaliteitspunt).
- **Boundary:** pas bewezen na groene verplichte checks, merge en live-readback van de nieuwe dagelijkse PR.
