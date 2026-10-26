# Portal Next — Winstnavigator / Decision Orbit (20 oktober 2026)

De bestaande Portal V2 blijft de enige frontend, en de bestaande Foresight-scenariostudio blijft de modelautoriteit. De Winstnavigator is een globale, tenant-authenticated visuele laag in de bestaande page shell; geen tweede portaal, scheduler, database of browser cache.

**Geleverde functionaliteit:** zeven bedrijfsdomeinen in een orbit; context-uitleg bij hover/focus, klik/touch, scrollwiel en pijltjestoetsen; mobiel swipe met scroll-snap; historische metingen met tijdscrubber; onderbouwde trend inclusief onzekerheidsband waar Foresight die levert; een hypothetische gevoeligheidsslider en drie scenario-presets; navigatie naar bestaande pagina's voor scenario, acties, bronnen en bedrijfsdomein.

**Bewijsgrenzen:** geen meting betekent geen forecast of pseudo-cijfer. Verbanden tussen domeinen zijn beschrijvend; effecten op winst worden alleen als werkelijk bewezen getoond wanneer de canonieke backend ze valideert. Tenantwissels resetten de interactiestatus. Read-only behalve reeds bestaande navigatie.

**Acceptatie open:** browseracceptatie 320/390/1024/1440, authenticatie met twee gescheiden klantaccounts, protected Required CI/CodeQL, echte touchscreeninteracties, exact SHA Netlify-uitrol en production readback; P0 #4215 blijft onafhankelijk open. Dit is de eerste onderscheidende globale laag, niet de volledige acceptatie van alle individuele visuals onder #4547.
