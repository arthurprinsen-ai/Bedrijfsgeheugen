# Bedrijfslek — van geverifieerde klantclaim naar relevante portaalcontext (v1)

## Echte oorzaak
De anonieme zelfscan zit live in de bestaande scanner, runtime-events en Powerhouse-besluitcyclus. De eerdere claim koppelde het eigen scan-ID wel aan het ingelogde bedrijf en emitteerde `scan_identity_verified`, maar de portaalprojectie werd alleen gevuld bij workshopscans met vooraf geregistreerde intake. Het Bedrijfslek bleef daardoor grotendeels een losse historische score.

## Bestaande autoriteit, uitgebreid
- **Klantidentiteit:** Netlify Identity → beveiligde `/api/portal-scans` → Edge-claim, geen browser-supplied tenant.
- **Projectie:** na succesvolle server-claim haalt dezelfde Edge-functie met `bg_portal_state_get_internal` de bestaande `canonical-brain`-laag op, en voegt gescoorde Bedrijfslek-dimensies via `bg_portal_state_put_internal` toe. Geen extra datalaag of verzonnen resultaat.
- **BusinessInput:** een herleidbare, zelfgerapporteerde nulmeting met het originele Brain-event-ID, inclusief herhaalbaar idempotent scan-ID. Bij bestaande legacy workshop-objecten blijft hun oorspronkelijke schema onaangetast; de nulmeting staat dan ook onder `portal.assessments.bedrijfslekScan`.
- **Impact:** aparte `healthCards` per domein en een observatiesignaal in de gebruikelijke dashboard-readmodel. De drie laagst scorende domeinen worden als **voorstel** aan `recommendedActions` toegevoegd, met reden en bron. `status=voorgesteld`, `executed=false` en `verified=false`.
- **Geen fictieve omzet:** de scores komen uitsluitend uit de eigen antwoorden. Bestaande gevalideerde management-, klant-, financiële en strategiewaarden worden behouden.
- **Echte opslagbevestiging:** `claimed=true` wordt pas geretourneerd nadat de nieuwe projectie bij de bestaande RPC `stored=true` terugleest en het bestaande `scan_identity_verified`-event is verwerkt.
- **Dedupe:** hetzelfde scan-ID levert dezelfde BusinessInput, signal-ID's en aanbevolen actie-ID's op. Geen tweede scheduler, CRM, actiemachine of zelfstandig Brein.

## Wat aantoonbaar losstaat van deze code
De eerste echte geauthenticeerde klantclaim moet live worden uitgevoerd en aan `portal_state_layers`, portaal-KPI's en HEARTBEAT-aanbeveling worden gekoppeld. Alleen dan is de contextdoorwerking bewezen. Een voorstel is geen besluit, en er wordt geen gerealiseerde waarde of verkoop gefingeerd. P0 #4198 blijft voor de totale commerciële keten open.

Fingerprint: `powerhouse|bedrijfslek|verified-portal-context-projection|v1`.
