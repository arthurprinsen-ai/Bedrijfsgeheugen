# External observer isolation & Netlify provider truth

Date: 2026-10-07  
Fingerprint: `delivery|external-observer|provider-truth-fallback|v1`

## Problem

Een externe chat-/web-fetcher kan een directe fetch naar `bedrijfsgeheugen.nl` weigeren zonder dat de origin of de productie-deploy defect is. Als die observer als productieautoriteit wordt behandeld ontstaat een vals negatief: een exact bewezen Netlify-deploy lijkt dan ten onrechte “niet live bewezen”.

## Structurele correctie

De delivery-control-plane maakt nu expliciet onderscheid tussen `OBSERVER_UNAVAILABLE` en `ORIGIN_UNHEALTHY`. Bij een observer-only blokkade wordt de onafhankelijke eindcontrole uitgevoerd op Netlify provider-truth plus immutable GitHub-lineage:

- published/current production deploy;
- `state=ready`;
- `context=production`;
- production alias `https://www.bedrijfsgeheugen.nl`;
- exact `commit_ref`;
- verwachte gedeployde functions aanwezig in de provider inventory;
- GitHub delivery-lineage/readback reeds bewezen.

De evaluator staat in `tools/site-shell/external-observer-production-proof.mjs`.

## Geen verzwakking

De bestaande `Production Release Readback` workflow blijft live HTTP/content/routes/readiness controleren wanneer dat vanuit de canonieke runner van toepassing is. Deze wijziging is uitsluitend observer-isolatie; zij maakt geen onbewezen origin-success groen en accepteert geen SHA-, alias-, context- of function-drift.

## Bewezen actuele productie

Netlify deploy `6ac63f6b64dc6f000885899d` is `ready`, production alias `https://www.bedrijfsgeheugen.nl`, met exact commit `e53c39adfb7dcd945515f2421ac2f233eb6cda5b`. Provider inventory bevat onder meer de nieuw gedeployde sovereignty/runtime functies.
