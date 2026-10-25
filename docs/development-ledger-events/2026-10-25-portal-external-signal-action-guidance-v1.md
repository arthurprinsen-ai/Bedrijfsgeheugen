# Append-only development ledger — 2026-10-25 — tenant-relevante externe signalen

Fingerprint: `powerhouse|portal-external-signal-to-tenant-action-disconnected|20261025-v1`
Obligation-ID: `portal:external-signals-tenant-action-guidance:20261025-v1`
Writer: `fix/portal-external-signal-action-guidance-20261025` | Parent-P0: #4198 | status: CANDIDATE

## Causale observatie
Op productie 2026-10-25: 1.169 externe signalen, 451 recent opgehaald; 65 bedrijfsnieuwsrecords maar laatste opgeslagen 2026-10-12. De authentieke klantgerichte `entrepreneur_intelligence` route haalt al canonieke signalen + tenant impacts + action candidates op. In het front-end waren de signalen en acties los; klantspecifieke bron→impact→actie bewijsroute op één kaart ontbrak.

## Enige scope / voorkomen van herhaling
Nieuwe pure frontend-helper, uitsluitend bestaande page reader en regressietest; bestaande Supabase, portalscope, commerciële scheduler, agents, outbound gate en Brain worden hergebruikt. Geen ongeautoriseerde provider-actie, geen dubbele publicatie, geen claim van betaalde omzet. Source URL HTTPS-only, source date freshness, generic actions review-only, DONE is niet provider-proof.

## Uitvoering en onafhankelijk slot
De branch bevat uitsluitend kandidaatcode en bewijsbestanden; node:test lokaal 5/5 en JavaScript syntax voor de overeenkomstige patch. Vereist nog: GitHub exact-head Required/CodeQL, protected merge, Netlify exacte SHA, geauthenticeerde klantportal readback en effectmeting in de bestaande loop. Status nooit handmatig GROEN forceren.
