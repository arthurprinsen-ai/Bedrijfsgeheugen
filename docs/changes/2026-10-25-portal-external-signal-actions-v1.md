# Portal V2 — externe bron naar bruikbare klantactie (25 oktober 2026)

## Oorzaak
De bestaande tenant-geautoriseerde API levert `powerhouse_intelligence_company_impact_v1` en `powerhouse_intelligence_action_candidate_v1`, maar de signaalkaart toonde geen directe reden en geen exact gekoppelde actie. Algemene signalen werden los getoond van de klantcontext. Dit is geen reden voor een nieuw agent-, database- of schedulernetwerk.

## Herstel
- Render per `signal_key`: datum, HTTPS-bron, klantspecifieke rationale waar aangetoond en concrete volgende stap.
- Duidelijk onderscheid tussen `KLANTSPECIFIEK`, algemeen voorstel en geen bewezen uitvoeringsactie.
- Een gerealiseerde omzet, provider-publicatie of bewezen risico wordt nooit afgeleid uit een afgeronde interne taak of generiek marktsignaal.
- Gebruik de bestaande service-authentieke `portal-state-eu` response; geen wijziging van tenantisolatie, brondata, en tokenroutes.
- Bewaar de bestaande ONE BRAIN/Heartbeat/evidence-workflow, writer discipline en controles.

## Verificatie
`node --test portal-v2/tests/external-signal-action-context.test.mjs portal-v2/tests/entrepreneur-intelligence-front-end.test.mjs`

**Niet live totdat** dezelfde head Required + CodeQL groen heeft, de beschermde merge en Netlify-readback goed zijn, en een ingelogde tenant exact zijn eigen bron/impact/acties ziet.
