# Herstel originele Portal V2 — ontbrekende releaseclassifier (21 november 2026)

## Onafhankelijk bewezen uitval

Netlify-productiedeploy `6b0196081d286bc840e104e8` staat READY op exact main `9e0f5a0c64782ce319779e1a723b01e34bc661d4`. De originele `production-release-readback` https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/44906714441 slaagde voor commit/Netlify-identity, geauthenticeerde twee-tenant Portal proof (HTTP200) en connector-readiness, maar faalde bij werkelijke appboot van `/portal-v2/` op 390 en 1440 px. Observatie: `hydrating:true`, `appMounted:false`, `recoveryShown:true`, één niet geladen asset per browser. Dit was een echte productie-uitval, geen testtimeout die uitgeschakeld mag worden.

De onafhankelijke **Netlify edge request logs** van 2026-11-21 13:08–13:11 UTC bevestigen **7 × HTTP404** op de exacte asset `https://www.bedrijfsgeheugen.nl/tools/netlify/release-status.mjs`. Bron: `portal-v2/modules/powerhouse-observability.js` importeert `deriveReleaseStatus` uit `../../tools/netlify/release-status.mjs`. De legitieme originele anti-bronlekregel `/tools/* /404.html 404!` blokkeert dit. De bestaande zeven geïnspecteerde Brain/Platform browsermodules uit #6093 verklaren deze achtste ontbrekende pure frontend-module niet.

## Oplossing in de oorspronkelijke keten

Binnen `tools/ci/build-portal-public-runtime.mjs` voegen we uitsluitend `tools/netlify/release-status.mjs` toe aan de expliciet gecontroleerde browser-pure allowlist (acht in plaats van zeven), en herschrijven we deze ene browserimport tijdens de bestaande Netlify-build naar `/portal-v2/browser-runtime/tools/netlify/release-status.mjs`. De canonieke classifier blijft één bron, de browser krijgt een byte-identieke SHA256-geverifieerde kopie in het eigen portaalpad. **Elke andere directe /tools-module wordt geweigerd**. De originele geforceerde 404's voor `/tools/*`, `/brain/*` en `/platform/*` blijven ongewijzigd. Geen nieuwe publieke serverroute, exposed environment, externe betaalde calls, scheduler of parallelle agent.

Het bestaande `tests/brain-portal-safe-browser-module-vendor-20261121.test.mjs` is aangepast voor realistische importer-replay, precies acht allowlistbronnen, byte-identiteit, manifest/HTTP readback én negatieve securitytests. De bestaande Portal Living Interface- en Powerhouse Delivery Self Optimization-skills en de canonieke learning compiler zijn bijgewerkt.

**Voltooiing pas na:** protected Required + CodeQL + Netlify preview/parity + merge, exacte Netlify READY en oorspronkelijke onafhankelijke productie-browserreadback met `appMounted:true` op 390/1440 px plus acht gehashte modulebytes. De 14 innovatieverplichtingen en bedrijfsuitkomsten worden niet afgevinkt op basis van dit technische herstel.
