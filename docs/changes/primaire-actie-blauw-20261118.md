# Primaire actie in Rituals-blauw (was oranje)

Twee besluiten botsten: 10 sept 2026 oranje conversieknop (isolatie-effect naast een blauwe hero met geel accent) en 17 nov 2026 Merkrichting Rituals (blauw alleen voor de primaire actie, verder papier en inkt). Het oranje-argument rustte op de oude blauwe hero; daarom volgt de knop nu het nieuwere besluit. Bewust herzien, niet stilzwijgend.

- Wijziging: kleurvariabelen in `assets/cta-conversie.css` (#2742D6, hover #1B2FA0, witte tekst, 6,9:1). Selectoren, knopmeting en terugdraaipad blijven gelijk.
- Rand volgt de knopkleur; focusring blijft inkt.
- Bewijs lokaal: twee testbestanden groen (contrast, selectoren, knopmeting).
- Niet bewezen: effect op klikgedrag. Meetpad: `bg_interacties` (meting.js) voor/na vergelijken; terugdraaien kan via dezelfde variabelen.
