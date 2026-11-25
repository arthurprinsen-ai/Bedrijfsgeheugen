# Powerhouse Control Plane — Netlify Identity JWT-herstel (29 oktober 2026)

Fingerprint: `portal|powerhouse-control-plane|missing-identity-jwt|20261029-v1`

## Werkelijke fout en oorzaak
Het op 29 oktober beschermde en Netlify-gepubliceerde Powerhouse cockpit had `portal-v2/control-plane-cockpit.js` dat `/api/powerhouse-control-plane` aanriep met `credentials:'same-origin'` maar **zonder de Netlify Identity JWT** in `Authorization`. De bijbehorende serverfunctie gebruikte `getUser()` zonder expliciet request. Een echte login op de client gebruikt Identity JWT/localStorage, geen gegarandeerde serverauth-cookie. Netlify edge-observability voor deze route gaf tussen ongeveer 18:30–18:54 UTC 49 keer 401 en twee afgebroken 499-responses; dat is bewijs van **authentisatiefouten**, maar niet op zichzelf bewijs dat het om een specifieke aangemelde beheerder ging.

## Herstel in de bestaande architectuur
- `portal-v2/control-plane-cockpit.js`: hergebruikt `ensureIdentityWidget` uit de bestaande portal-state, haalt de actuele Identity-gebruiker en `user.jwt()` op en stuurt `Authorization: Bearer <jwt>` uitsluitend aan dezelfde bestaande adminroute. Geen gebruiker/token/ongeldig token → geen datarequest. `401/403` blijft fail closed; niet-admin kan nooit de statuskaart laden.
- `netlify/functions/powerhouse-control-plane.mjs`: alleen `GET`, Bearer vereiste vóór iedere server-side Supabase-call, provider-validatie `getUser(request)` met foutstatus 503 voor Identity-providerfout, daarna ongewijzigde adminrollencheck. Echte server-side Supabase service-role blijft verborgen. Geen nieuwe Netlify Function, scheduler, edge worker, publisher, identiteitstabel of nieuw portaal.
- `tests/brain-powerhouse-existing-systems-portal-readback-20261029.test.mjs`: regresstests voor ontbrekend/ongeldig/volgelopen JWT, geen anonieme backendcalls, echte JWT-header naar originele same-origin route, 403, statisch verzoekgebonden provider/auth-before-key contract.

## Releasestatus en open bewijs
Deze source is **CANDIDATE**, niet live zolang de beschermde PR ontbreekt. Vereist: originele GitHub Required/BRAIN/CodeQL + System Map inventarishash op exact head; merge naar main; reguliere Netlify productiebundel op descendant SHA; eigenaar authenticeert met echte Netlify Identity, backend geeft 200 + de vijf zichtbare Supabase autoriteitsviews; negatieve 401/403 blijft werken. Dat alleen is portaalbewijs, geen bewijs van klantomzet, agentimplementaties of Brain-uitvoering.

## Borging
**Oorzaak**: client/server verwachtten verschillende Identity transportmethoden. **Preventie**: elke nieuwe admin read-only portal endpoint gebruikt dezelfde request-bound `Bearer JWT` als `/api/powerhouse-cro-other-data`; tests bewaken deze keten en succes van de inhoudsbron apart. Historische 401's worden niet als nieuwe betalingen, leads of foutvrije sessies geteld. Brain failure-registratie en ontwikkellog bewaren fingerprint en echte bewijs-URL. Geen tweede scheduler of bypassen van regels.
