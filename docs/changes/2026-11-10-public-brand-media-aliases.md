# Canonical website brand media: herstel oude 404-routes

10 november 2026. Netlify-productie laat oude publiciteit en browser-faviconpaden naar HTML 404 gaan, terwijl `index.html` en de video-placeholder nog `/og-image.png` noemen. Onafhankelijke HTTP-syncreadback uit origineel Supabase:

- `https://www.bedrijfsgeheugen.nl/og-image.png` — HTTP 404 (geen PNG, HTML fallback)
- `https://www.bedrijfsgeheugen.nl/favicon.ico` — HTTP 404
- `https://www.bedrijfsgeheugen.nl/assets/merk/banner-instagram-tegel.jpg` — HTTP 200, JPEG (origineel merkbeeld)
- `https://www.bedrijfsgeheugen.nl/favicon.png` — HTTP 200, PNG.

De originele `_redirects` krijgt vóór alle andere regels twee permanente same-origin aliassen voor ontbrekende URL's. Geen nieuwe afbeeldingsgenerator of dubbele CMS/Netlify-route. De bestaande LinkedIn/Instagram-merkillustratie blijft de bron, geen nieuw fictief contentbewijs. Kleine regressietest op exacte bestandsnaam, uniek pad, beveiligde interne redirect en geregistreerde homepageverwijzing.

Gates: exact-head GitHub Required+CodeQL, Netlify-build en nieuwe productie-SHA, daarna HTTP-status 301 plus daadwerkelijk bereikbare bestaande asset. De inhoud van het merkmateriaal kan later redactioneel worden verbeterd, maar mag niet als nieuwe OpenGraph-afbeelding worden verzonnen.

Het grotere portaal- en bedrijfsdata-incident blijft https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215.
