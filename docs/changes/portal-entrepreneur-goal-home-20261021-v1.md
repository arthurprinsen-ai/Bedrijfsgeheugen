# Portal V2 — doelgestuurde ondernemershomepage v1

Fingerprint: `portal|frisse-blik|goal-first-entrepreneur-home|v1`.
Canonieke obligation: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4578

## Gebruikersprobleem en keuze
Een ondernemer komt na de Frisse Blik voor een zakelijke uitkomst, niet voor uitleg over AI, scores, bronnen of systeemtaxonomie. V2 behoudt alle bestaande specialistische pagina's, maar start vanuit **ambitie → bekende feiten → concrete volgende stap → uitvoering → werkelijk resultaat**. Geen derde portaal, scheduler, database, tweede besluitketen of nieuwe AI-provider.

## Implementatie en autoriteit
- `portal-v2/entrepreneur-home-model.js`: zeven bestaande `USER_GOALS` uit de gedeelde business-context. Bewijsgerichte stapbepaling, geen geldbedragen zonder bron.
- `portal-v2/entrepreneur-home.js`: aanspreekbare, toegankelijke UI boven bestaande V2-home; alleen zichtbaar op de overview-route; logout/tenant-switch wist de vorige principalweergave.
- `portal-v2/entrepreneur-home.css`: touch, toetsenbord en reduced-motion.
- `portal-v2/app.js` en `portal-v2/index.html`: één mount op bestaande `portalDomainState` en `portalStateClient`.
- Een expliciet gekozen primair doel wordt onder `portal.business_context.primary_goal` en `portal.business_context.goals` opgeslagen. Bestaande doelen blijven bewaard. `goal_confirmed_at` bevestigt alleen de voorkeur; de bedrijfsfase of cijfers worden niet stil als geverifieerd gemarkeerd.
- `createPortalDomainState.patch/flush` blijft de **enige** write-route. Success vereist de bestaande server/persisted-state-ACK plus canonieke BusinessInput/Brain-ACK. Geen tweede read-model of browser storage.
- De Frisse Blik/Bedrijfslek-claim wordt uitsluitend via de bestaande geauthenticeerde tenant-claimroute getoond en uitgevoerd; de homepage geeft nooit de indruk dat een ongeclaimde scan verwerkt is. De reeds aanwezige `/api/portal-scans`-readback publiceert een kortstondig clientevent met uitsluitend het **aantal** geverifieerde scans. De homepage reset dit op principalwissel en logoff; geen scanwaarden of receipts in het event.
- Mogelijke acties komen uitsluitend uit de bestaande `buildOwnerOperatingModel`, en alleen wanneer `evidence_health.status==='healthy'` en `source_refs` aanwezig zijn. Een voorstel is geen uitvoering; de eigenaar beslist via de bestaande actiespagina.
- Een doel zonder meetbare target leidt naar `bedrijfssituatie`; een doel met target maar zonder passend bronbewijs leidt naar een toepasselijke bestaande specialistische pagina.

## Bestaande functionaliteit intact
Sidebar, alle bestaande paginas, managementoverzichten, scenario- en Winstnavigator, scans, rechten, RLS, bestaand Brain, Powerhouse, Heartbeat en data-/AI-instellingen blijven ongewijzigde authorities. Geen provideractie buiten de bestaande goedkeuringspaden.

## Acceptatie
Regressies: `node --test portal-v2/tests/entrepreneur-home.test.mjs`, daarna de normale Required / BRAIN / CodeQL / production readback. Bestaande baseline/parity-tests blijven verplicht.
Productie-acceptatie vóór terminal groen:
1. Echte ingelogde tenant A: Frisse Blik claim en scan-to-Brain-readback.
2. Tenant A: doel kiezen → source-record en Brain ACK → refresh/herlogin → opgeslagen doel en aangepaste next step.
3. Tenant B: eigen andere doel; nooit data of doel van A.
4. Ontbrekende financiële bron: onbekend, geen fictieve KPI, forecast, marge of gerealiseerde besparing.
5. Actie: geautoriseerde status en provider-readback; outcome pas na afzonderlijk bewijs.
6. Responsive keyboard/touch/routeback en reduced motion, geen interferentie met specialistische paginas.
7. Exact HEAD Required, CodeQL, protected merge, Netlify current/main exact SHA, echte DOM readback.

**Status:** kandidaatcode; bovenstaande productie- en geauthenticeerde acceptatie worden niet door een codecommit bewezen. Geen gates omzeilen.

## Gecontroleerde releasewaarheid — 21 oktober 2026

De oorspronkelijke protected PR [#4579](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4579) is gemerged in exacte `main`-SHA `a57b7c93e731b95aaf90fdf77276d10fe5f9f48b`. Required CI, Portal, Backend, Netlify build parity en CodeQL JavaScript/Python zijn succesvol; Netlify `bedrijfsgeheugen` rapporteert huidige productie-deploy `6ad86f363d80b09aaceebcfc`, `state=ready`, `context=production`, `branch=main`, dezelfde exacte `commit_ref`, gepubliceerd `2026-10-21T07:54:26.530Z`. De terminal-closure en skillprojectie zijn succesvol (runs [39565061056](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39565061056) en [39565060790](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39565060790)).

Status: **`LIVE_PROVEN_PROVIDER_TRUTH` voor de release**. De geïsoleerde, ingelogde acceptatie van twee echte klanten — Frisse Blik claim → Brain-readback → doel opslaan → herlogin → tenantisolatie — is nog **niet bewezen**. GitHub [#4578](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4578) blijft alleen voor dat acceptatiebewijs open. Ontbrekende meetgegevens en gerealiseerde waarde mogen niet uit tests of uit de provider-deployment worden afgeleid.
