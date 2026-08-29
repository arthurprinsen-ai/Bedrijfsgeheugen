"""Materialiseer gedeelde V18-sitechrome voor brongebaseerde kwaliteitschecks.

Herstelde pagina's houden de canonieke header/footer runtime-DRY via
/assets/recovered-page-shell.js. De browsercontrole ziet die runtime-DOM vanzelf;
de SEO-controle leest bewust bron-HTML. Daarom materialiseren we uitsluitend in
de tijdelijke CI-checkout exact dezelfde canonieke fragmenten voordat de checks
starten. Er wordt niets naar de branch teruggeschreven.
"""
from pathlib import Path

ROOT = Path.cwd()
HEADER_MARKER = '<div data-bg-shared-shell="header"></div>'
FOOTER_MARKER = '<div data-bg-shared-shell="footer"></div>'

kop_path = ROOT / '.github/canoniek/kop.html'
voet_path = ROOT / '.github/canoniek/voet.html'

if kop_path.exists() and voet_path.exists():
    kop = kop_path.read_text(encoding='utf-8').strip()
    voet = voet_path.read_text(encoding='utf-8').strip()
    for page in ROOT.glob('*.html'):
        text = page.read_text(encoding='utf-8')
        if HEADER_MARKER not in text and FOOTER_MARKER not in text:
            continue
        if text.count(HEADER_MARKER) != 1 or text.count(FOOTER_MARKER) != 1:
            raise RuntimeError(f'gedeelde shell-markers niet exact eenmaal aanwezig in {page}')
        text = text.replace(HEADER_MARKER, kop, 1).replace(FOOTER_MARKER, voet, 1)
        page.write_text(text, encoding='utf-8')
