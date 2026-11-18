# De Kloof No. 04: openbare pagina's en Engelse editie — 18 november 2026

Wat: het magazine staat nu op een eigen pagina (`/de-kloof`) met samenvatting en twee downloadlinks. De Engelse pagina is `/en/de-kloof`, gemaakt door de bestaande vertaalroute uit de cache in `config/bg-static-i18n-en.d/` (18 zinnen met eigen Engelse tekst toegevoegd). Engelse PDF: `the-gap-no04-2026-q4.pdf` (27 pagina's, 63 invulvelden). De pagina komt uit `site/inhoudspaginas.json`; de generator kent nu een optioneel tweede knopveld `cta2`. Exclusiviteitstekst op pagina 2 sluit aan op het openbare karakter (gratis, niet voor iedereen).

Bron van de vertaling staat in `portal-v2/reports/de-kloof/source/` (mag_en.py, t1-t4.py).

Test: `tests/brain-portal-kwartaalrapporten-20261106.test.mjs`.
