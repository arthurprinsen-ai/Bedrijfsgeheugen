from pathlib import Path

p = Path('index.html')
s = p.read_text()

css_anchor = '.knop.lijn:hover{background:var(--geel);color:var(--inkt);border-color:var(--inkt)}\n\n.chat{'
css_insert = '''.knop.lijn:hover{background:var(--geel);color:var(--inkt);border-color:var(--inkt)}

.hero-media-frame{position:relative;aspect-ratio:16/9;margin:-1.15rem -1.15rem 1rem;overflow:hidden;border-bottom:2px solid var(--inkt);background:#EAF1F3}
.hero-product-video{width:100%;height:100%;display:block;object-fit:cover;background:#EAF1F3}
.hero-media-badge{position:absolute;left:.75rem;bottom:.7rem;display:inline-flex;align-items:center;min-height:30px;padding:.35rem .65rem;border-radius:999px;background:rgba(20,23,26,.82);color:#fff;font-size:.72rem;font-weight:700;letter-spacing:.02em;backdrop-filter:blur(5px)}
@media(max-width:980px){.hero-media-frame{aspect-ratio:16/9}}

.chat{'''
if css_anchor not in s:
    raise SystemExit('CSS anchor missing; refuse broad patch')
if 'class="hero-product-video"' in s:
    raise SystemExit('hero product video already present; refuse duplicate')
s = s.replace(css_anchor, css_insert, 1)

html_anchor = '  <div class="chat">\n    <div class="vraag">'
html_insert = '''  <div class="chat">
    <div class="hero-media-frame">
      <video class="hero-product-video" autoplay muted playsinline loop preload="metadata" aria-hidden="true" tabindex="-1"><source src="/assets/openart-hero-iphone-safe-v1.mp4" type="video/mp4"></video>
      <span class="hero-media-badge">AI-gedreven. Menselijk gericht.</span>
    </div>
    <div class="vraag">'''
if html_anchor not in s:
    raise SystemExit('Hero chat anchor missing; refuse broad patch')
s = s.replace(html_anchor, html_insert, 1)
p.write_text(s)
print('Homepage hero patch applied exactly once')
