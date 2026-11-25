# P0 #4198 — release admission and omnichannel proof boundaries

## Productie-observatie, 12 oktober 2026
- De primaire website is live. Dit is geen bewijs voor autonome commerciële resultaten.
- De bestaande Supabase omgeving heeft één uurlijkse assurance-job (id 129, minuut 52); geen tweede scheduler.
- De dagelijkse connectiebeoordeling was 23.295/23.295. Een besluit is geen verzonden bericht.
- Het publicatieregister bevat één LIVE_PROVEN kanaal (LinkedIn bedrijf), een LinkedIn-persoonlijke publicatie-ID zonder onafhankelijke inhoudsreadback, een gegenereerde blog en Instagram zonder geldig passend media-asset.
- Geen bewezen commercieel verzendbare e-mailontvangers of meetbare omzet uit deze cyclus.

## Correctie
PR #4343 spiegelt bestaande Edge- en database-autoriteiten naar GitHub en behoudt isolatie op de bestaande cron. Machineleesbare release-identiteit, drie verplichte closure-artefacten en één regressietest zijn toegevoegd. Required en CodeQL worden niet omzeild.

## Acceptatie
1. Eén Brain/Heartbeat eigenaar. Geen extra cron, parallelle verzender of blind opnieuw versturen.
2. Publicaties moeten een externe referentie plus onafhankelijke readback hebben. PUBLISHED is niet gelijk aan LIVE_PROVEN.
3. Gmail/DM vereist daadwerkelijke ontvangerautoriteit; accountverbinding is geen toestemming. Geen massale goedkeuring of ongewenste berichten.
4. Klantbewijs is: bron -> beslissing -> geautoriseerde uitvoering -> onafhankelijk gemeten resultaat -> leerbijstelling.
5. Protected merge, productiebron-pariteit en een echte geautoriseerde klantuitvoering blijven vereist. Deze documentatie bewijst geen order, aflevering of inkomsten.

## Verificatie
Node regression: node --test tests/brain-p0-4198-omnichannel-assurance-closure-v1.test.mjs. Daarna bestaande Required, CodeQL, backend en Supabase Preview; exact main- en runtime-readback. P0 #4198 blijft open tot extern klantbewijs.
