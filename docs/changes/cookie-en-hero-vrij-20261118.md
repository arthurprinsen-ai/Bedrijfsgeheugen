# Cookiebanner: Engels op /en/ en rechtsonder, hoofdknop vrij

Live gemeten na `hero-controle-2-20261118`: op /en/ was de toestemmingsbanner Nederlands ("Met jouw toestemming...", knoppen "Alleen noodzakelijk"/"Accepteren") en lag over de hoofdknop (EN-hero is een regel langer: knop 720–773, banner vanaf 739).
- `analytics-sitebreed.mjs`: pagina's met `lang="en"` krijgen de Engelse banner (tekst uit de vastgelegde EN-cache, link naar /en/privacy, aria-label "Cookie notice"). De Nederlandse banner blijft onveranderd.
- `rituals-belevenis.css`: op schermen vanaf 900 px staat de banner rechtsonder (boven de WhatsApp-knop), zodat de hero-knop in NL en EN vrij blijft. Cache-bust `?v=20261118g`.
Bewijs: unit-aanroep NL/EN, i18n-, toestemming- en analyticstests groen. Niet bewezen: live-readback tot na merge; effect op toestemmingspercentage (meten).
