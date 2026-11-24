# Beveiligingsheaders Bedrijfsgeheugen — 20 november 2026

## Gecontroleerd risico
De publieke website had HSTS, nosniff en X-Frame-Options, maar op de homepage ontbrak Content-Security-Policy. Dit is bevestigd via HTTP HEAD in de browser; de Netlify-website heeft bestaande inline en externe scripts. Een volledige script-src enforcement zonder compatibiliteitsinventaris zou bestaande klant- en marketingfuncties kunnen breken.

## Implementatie in de oorspronkelijke websiteketen
Deze wijziging voegt een conservatieve afgedwongen CSP toe (object-src none, base-uri self, frame-ancestors self, upgrade-insecure-requests) in zowel `_headers` als `netlify.toml`, met script-inventaris voorlopig alleen Report-Only. Voor `/intern/*` blijft de bestaande intern-slot Edge Function de autorisatiebron; alleen cache-, indexerings-, referer- en framingbeveiliging worden verscherpt. De bestaande wekelijkse Security Operations Proof krijgt de bestaande provider-readbackcheck voor Bedrijfsgeheugen en de twee PW-coachroutes.

## Controlegrenzen
De PW-app heeft al productie-CSP met SHA-256 inline-script hashes, geen unsafe-inline JS, DENY-framing en nosniff. Dat is onafhankelijk in de browser bewezen; Bedrijfsgeheugen CSP in deze PR is **niet live** totdat de beschermde bronmerge, Netlify READY en HTTP-readback zijn voltooid. De Supabase-waarschuwing voor de aparte getokeniseerde externe SECURITY DEFINER cronfunctie blijft apart OPEN; het wegnemen van anonieme EXECUTE zonder caller-migratie kan een originele herstelketen beschadigen.

- Tests: `tests/brain-security-csp-web-boundary-20261120.test.mjs` en `tests/brain-security-live-headers-monitor-20261120.test.mjs`.
- Productiedomein: https://www.bedrijfsgeheugen.nl/
- OWASP/browser rationale: https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
- Provider configuration: https://docs.netlify.com/manage/routing/headers/
