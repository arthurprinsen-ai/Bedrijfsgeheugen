# 9 oktober 2026 — dagblog: exacte canonical terugkoppelen

## Reële oorzaak
De native blog fallback registreerde `blog:onprijsd-probleem-bedrijfsvoering` als dagartikel en leverde GitHub PR #4252 (merged) en Netlify deploy `6ac8c38172d5dd0008a6169a` op. De bestaande, terechte SEO-redirect `/blog/onprijsd-probleem-bedrijfsvoering/` → `/blog/ongeprijsd-probleem-bedrijfsvoering/` (301!) leidt echter naar een ander, ouder artikel. Onafhankelijke GitHub live-watchdog #37918931429 faalde consequent op canonical mismatch. Een geslaagde build of HTTP 200 telt daarom NIET als daily-article readback.

## Bestaande bron van waarheid
Het werkelijk vandaag gedateerde, source-backed Powerhouse-artikel `blog:sopv-2026-plasticverwerkers-productietest-subsidie` bestond reeds op de hoofdbranch en was via Supabase export beschikbaar. Onafhankelijke Supabase pg_net GET #1570 las de openbare productiepagina `https://www.bedrijfsgeheugen.nl/blog/sopv-2026-plasticverwerkers-productietest-subsidie/` terug met HTTP 200, de juiste canonical-URL, het exacte `data-content-id` en de titel. Geen vervangend artikel, geen extra schrijfsysteem, geen opheffen van duplicate-SEO-redirect.

## Herstel
Herstel uitsluitend `data/content-publication-ledger.json` voor 2026-10-09 naar de echte live Powerhouse-canonical, met status `selected` tot de officiële watchdog zelf een onweerlegbare LIVE-proof in het ledger vastlegt. Pas de bestaande candidate-regressietest aan zodat verkeerde canonical-herverwijzing niet opnieuw als publicatie geldt, terwijl de oude geconsolideerde redirect intact blijft.

## Verplicht eindbewijs
Required + CodeQL; protected merge; exact production readback op `blog:sopv-2026-plasticverwerkers-productietest-subsidie`; writer-proven ledger `state=live`; canonieke Brain/Heartbeat publicatie-obligatie; meten en leren. PR-open/merge wordt nooit gelijkgesteld aan volledige commerciële afhandeling.
