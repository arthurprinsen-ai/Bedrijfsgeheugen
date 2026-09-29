# Social duplicate prevention governance — 2026-09-29

## Aanleiding

De Bedrijfsgeheugen LinkedIn-bedrijfspagina publiceerde op opeenvolgende dagen inhoudelijk dezelfde story family: afwezigheid/vertrek van een medewerker waardoor klant-, proces- en contextkennis alleen in het hoofd van één persoon zat.

De runtimefix blokkeert dit inmiddels vóór provider-write. Deze governance-update zorgt dat dezelfde preventie ook permanent wordt geërfd door alle huidige en toekomstige chats, agents, schedulers, watchdogs en herstelroutes.

## Permanente regel

Historische uniekheid bestaat uit cumulatieve controles:
1. raw text hash;
2. normalized text hash;
3. near-duplicate/shingle similarity;
4. canonical story fingerprint;
5. semantic story-family/example uniqueness;
6. atomic single-writer claim voor concurrency/retry.

De laatste stap voorkomt dubbele uitvoering van dezelfde claim, maar bewijst niet dat een onderwerp historisch nieuw is.

Voor LinkedIn company worden dynamische tracking-URLs, datumtokens, hashtags en formatting-noise vóór de historische vergelijking geneutraliseerd. Een andere CTA of formulering maakt een oude story family niet nieuw.

## Negative evidence

Een door de gebruiker gemelde duplicate is bindende negatieve evidence. De story family wordt daarna retired en mag niet opnieuw worden geselecteerd.

Retired company family:
`employee_absence_or_departure__knowledge_only_in_heads`.

## Authorities

- runtime: `supabase/functions/powerhouse-social-publisher/index.ts`
- LinkedIn skill: `.agents/skills/linkedin-composio-publisher/SKILL.md`
- continuity skill: `.agents/skills/powerhouse-continuity/SKILL.md`
- global chat/agent inheritance: `AGENTS.md`
- Brain learning: `brain/learning/2026-09-29-linkedin-company-historical-dedupe-v1.json`
- System Map: `platform/system-map/canonical-system-map.mjs`
- regression: `tests/brain-social-duplicate-prevention-governance-v1.test.mjs`

## Resultaat

Nieuwe chats en agents hoeven deze incidentles niet uit conversatiegeheugen te kennen. Zij lezen de repository-native authority en moeten vóór social provider writes dezelfde historical-uniqueness invariant afdwingen.
