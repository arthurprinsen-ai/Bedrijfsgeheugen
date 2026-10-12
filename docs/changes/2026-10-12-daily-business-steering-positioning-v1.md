# 12 oktober 2026 — Bedrijfsgeheugen verkoopt dagelijkse ondernemingssturing

**Marktsignaal:** Een daadwerkelijk benaderde relatie herkende de dienstverlening als een van vele vergelijkbare aanbieders. Het probleem zit niet alleen in de kopij: de homepage gaf AI, kennisborging en integraties te vroeg voorrang boven het wezenlijke productverschil.

## Keuze
Bedrijfsgeheugen is **een dagelijkse, continu lerende besturingslaag** bovenop bestaande bedrijfsapplicaties. De ondernemer krijgt inzicht in wat interne en externe veranderingen betekenen voor strategie, doelen, processen, mensen, financiële impact en uitvoering. De keten is **signaal → context → consequentie → beslissing → actie met eigenaar → uitkomst → leren**. POWERHOUSE is de interne intelligence-/uitvoeringsmotor, niet een afzonderlijke AI-vendorcategorie.

**Hero NL:** 'Je bedrijf verandert elke dag. Je besturing moet mee.'

**Hero EN:** 'Your business changes every day. Your decisions should keep up.'

De hero legt het concrete klantresultaat uit, niet de lijst met agents. In de AI-ecosysteemsectie wordt expliciet uitgelegd waarom dit meer is dan een chatbot, dashboard of losse automatisering. Bestaande payoff 'Aanpakken zonder aanmodderen' en merkbelofte 'Uit hoofden, in je bedrijf. En dan werkend' behouden hun afzonderlijke rol, evenals de originele CTA's.

## Technische projectie
- Één nieuwe **late** site-shell copy-projector wordt toegevoegd aan de bestaande Netlify-build, na NL/EN-routes en site-coherence en vóór release-evidence; geen nieuw build-proces of tweede homepage.
- Projecteer zowel NL- als EN-herotekst en POWERHOUSE-sectie in de **uiteindelijke** HTML, niet in een vroeg sjabloon dat latere V18-builders overschrijven.
- Geen nieuwe externe productclaims, fictieve AI-autonomie of gesuggereerde omzet; verifieer daadwerkelijke mogelijkheden.
- Idempotent, één H1, bestaande interne routes, CTAs en functionaliteit blijven staan. Fout als de doelpagina ontbreekt, dus geen schijnsucces.

## Release & meetbaarheid
Tests: `tests/homepage-daily-steering-positioning.test.mjs`. Verplicht: GitHub-Required/CodeQL/Netlify build, beschermd merge, exacte live DOM-readback op `https://www.bedrijfsgeheugen.nl/` en `https://www.bedrijfsgeheugen.nl/en/` (hero, lead, sectie, CTA, mobile). Meet vervolgens zelfscan-intent, relevante gesprekken, offerte en betaalde opdracht; alleen daadwerkelijk geobserveerde omzet telt als resultaat. Openstaande technische route blijft onderscheiden van daadwerkelijk behaalde conversie.
