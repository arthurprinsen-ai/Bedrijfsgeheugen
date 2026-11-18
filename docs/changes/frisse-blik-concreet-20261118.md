# Frisse blik: prijs, stappen en vervolg zichtbaar

Arthur vroeg de site aansprekender te maken vanuit de problemen van ondernemers. Leesbeoordeling live /frisse-blik: een prototype met twaalf schuifjes, zonder prijs, duur, stappen of vervolg.
Wijziging: nieuwe buildstap `tools/site-shell/apply-frisse-blik-concreet.mjs` (na localized-routes en commercial-pricing) die één blok invoegt: gratis zelfscan in 3 minuten, Bedrijfsgeheugen Scan voor € 2.950 excl. btw met vaste prijs vooraf, wat het rapport laat zien, en dat de scan bij bouwen wordt verrekend. NL en EN, idempotent, geen tweede kop, geen `offers` in structured data.
Bedrag: € 2.950 volgt de bestaande prijsconfig en de bestaande pagina-tekst; het eerder genoemde € 2.900 staat op andere plekken en blijft een open consistentiepunt.
Niet bewezen: live-readback en doorklik naar de zelfscan.
