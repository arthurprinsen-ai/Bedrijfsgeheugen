# Herstel: originele innovatiecode wel beschermd gemerged, maar door Netlify onterecht overgeslagen

**Datum:** 15 november 2026. **P0:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198.

## Feitelijk incident
De volledige broncontrole van de verkoopuitvoering werd gebouwd en beschermd gemerged via PR #5857 als `875244148e910e43928a11221f6e75496f491ebb`. De onafhankelijke Netlify-provider meldde voor exact die productiedeploy `6af9bc3634ea5ebd680aecf4` echter `error` met `Canceled build due to no content change`. De laatst werkelijk gepubliceerde site bleef op `00c99582067fc38dd1dfc2ab8a97c87f89c20c5d`.

## Structurele root cause
De bestaande Netlify `ignore`-command deelt één originele classifier met de protected test en release readback: `tools/delivery/netlify-deployment-applicability.mjs`. De concrete server-import `platform/portal/powerhouse-existing-integration-read-model.mjs` werd alleen als generieke backend aangemerkt, niet als rechtstreeks gebundelde Netlify-runtime. Daarom kon een echt gewijzigde authenticated read API door de selective-ignore van productie vallen.

## Correctie binnen dezelfde keten
Het exacte imported modulepad wordt in `NETLIFY_RUNTIME_EXACT` opgenomen, zodat de bestaande classifier `netlifyRuntimeRequired=true` en `deploymentRequired=true` retourneert, ook wanneer alleen dat modulepad en governance-bestanden zijn gewijzigd. Geen tweede systeem, scheduler, queue, releasewriter, permissie of dummy-push.

Om de autoritatieve release werkelijk opnieuw te laten bouwen, wordt het al bestaande, eerste-partij geauthenticeerde `/api/powerhouse-control-plane` met een privacyveilige header aangevuld: `x-bg-innovation-audit-scope` met alleen `FULL_LAST_7D`, `ABOVE_500_FAIL_CLOSED` of `UNKNOWN`. Header pas na oorspronkelijke Identity JWT en admin-role, geen bronrijen, identifiers, ontvangers, tokens of valse levering. De oorspronkelijke API-body en uitgevoerde event/action-readback blijven ongewijzigd.

## Acceptatiegrens
- Protected Required, CodeQL en Netlify CI build groen.
- Netlify provider meldt actuele **production READY** en exact protected main commit voor de herstel-PR, in plaats van `no content change`.
- De bestaande serverfunction `powerhouse-control-plane` is daadwerkelijk gebundeld in die deploy.
- Authenticated admin readback toont originele scope, geen browser/tenant/omzetresultaat op basis van een statische marker.
- In originele ONE BRAIN operatie `edebcb32-335b-49f0-b527-eb4289f95c5c` blijft consumer ACK **false**, originele innovatieverplichting OPEN, tot agent echte resultaten onafhankelijk meet en afsluit.

De historische doelwaarde 164/164 voor volledige broncontrole is geen bewijs dat de nieuwe live API dit al heeft gedaan; deze moet na release worden herbevestigd. Rollback via bestaande beschermde deploy, geen herschrijven van bron- of historiegegevens.
