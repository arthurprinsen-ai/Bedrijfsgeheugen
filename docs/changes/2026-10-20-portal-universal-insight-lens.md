# Powerhouse Inzichtlens — portaalbrede innovatie (2026-10-20)

Obligation-ID: portal-universal-insight-lens-20261020
Delivery-Lane: portal
Candidate-Type: implementation

Alle pagina's behouden de canonieke Portal V2-router en bestaande realtime data-/berekeningsbronnen. Eén read-only interactielaag geeft grafieken, tabellen, canvassen, roadmaps en scenario's een contextuele Inzichtlens met aanraak-/toetsenbordbediening. Tabelrijen kunnen worden doorzocht; twee inzichten kunnen binnen de sessie naast elkaar worden gezet. Het Consequentiekompas leidt naar bestaande bron-, scenario- en actiepagina's. Dit is expliciet geen nieuwe causale voorspeller.

Bronstatus wordt alleen uit daadwerkelijke data-source/data-evidence metadata gelezen. Geen bronreferentie betekent niet geverifieerd; geen voorbeeldcijfers, autonome writes of nieuwe scheduler. Focus, Escape, toetsenbord, 44px doelen en responsive panel zijn toegevoegd.

Nog vereist voor LIVE_PROVEN: Required CI en CodeQL op exacte head, visual preview op 320/390/1024/1440, 2-klantenacceptatie met echte data, beschermde merge en Netlify production readback. Daarzonder niet groen rapporteren. Toekomstig: bewezen, brongebaseerde causale cross-domain berekeningen in Brein in plaats van de frontend.
