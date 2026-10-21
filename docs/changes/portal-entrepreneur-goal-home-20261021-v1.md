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
