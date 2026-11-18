# De Kloof No. 04: openbare pagina's en Engelse editie — 18 november 2026

Wat: het magazine staat nu op een eigen pagina (`/de-kloof`) met samenvatting en downloadlink, en er is een Engelse editie (`/the-gap`, PDF `the-gap-no04-2026-q4.pdf`, 27 pagina's, 63 invulvelden). Beide pagina's komen uit `site/inhoudspaginas.json`; de generator kent nu een optioneel veld `lang`. Exclusiviteitstekst op pagina 2 sluit aan op het openbare karakter (gratis, niet voor iedereen).

Engelse pagina draagt nog de Nederlandse kop en voet van de site. Bron van de vertaling staat in `portal-v2/reports/de-kloof/source/` (mag_en.py, t1-t4.py).

Test: `tests/brain-portal-kwartaalrapporten-20261106.test.mjs`.
