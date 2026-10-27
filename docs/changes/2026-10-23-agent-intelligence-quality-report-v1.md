# Kwaliteitsrapport binnen Agent Intelligence — 2026-10-23

## Doel en eigenaar
Deze wijziging versterkt de bestaande, tenantgebonden Powerhouse Control Center-tab **Leerintelligentie**, onder de bestaande Brain/Heartbeat-readback. Geen nieuwe DB, scheduler, foutregister, werkende agent of externe connector.

## Rapport
Zeven bewijsrubrieken: CI/CD & productie; incidenten; agenttraces; kennis/leren; bronherkomst; unieke klantuitkomsten; autorisatie/privacy. De statuses onderscheiden WAARGENOMEN, AANDACHT, NIET GEMETEN, NIET BEWEZEN en strikt bewezen bronbewijzen. **Geen samengestelde kwaliteitsscore** wanneer denominatoren en onafhankelijke metingen ontbreken.

De client toont slechts de al geauthenticeerde runtime-selectie met tijdvenster. Een event met groene CI-status geldt niet als exact-gepubliceerde SHA; een trace-ID is geen trace-grade; een PROVEN-kennisrecord is niet automatisch klantwaarde. Klantresultaten vergen unieke ID, tenantcontrole, productie- én leerbewijs met toegestane HTTPS-verwijzingen. Bewijstekorten worden niet met null=0 gecamoufleerd.

## Externe onderzoeksbasis
DORA (https://dora.dev/quickcheck/?v=2026) voor lead time, deployments, change failure en herstel; OpenAI trace grading (https://developers.openai.com/api/docs/guides/trace-grading) voor reproduceerbare tool-, handoff- en guardrail-evaluaties. Beide zijn methodieken, geen claims dat alle meetbronnen al geïntegreerd zijn.

## Acceptatie
Exact-head Node-regressies van het bestaande analytische modulebestand plus vier nieuwe tests: geen fictieve scores, deduplicatie, streng klantbewijs en trace-labels zonder overclaim. Daarna uitsluitend via protected Required/CodeQL, merge, Netlify productie-SHA en Portal-readback. De nieuwe rapportage is read-only, houdt ontbrekende bronnen zichtbaar en verlangt afzonderlijk klantresultaatbewijs.
