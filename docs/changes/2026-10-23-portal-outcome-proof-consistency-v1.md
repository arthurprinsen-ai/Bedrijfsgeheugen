# Eén bewijswaarheid in de ondernemersreis — 23 oktober 2026

Parent: [één ondernemersreis #4585](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4585); voortbouwend op [bewijsvaste Autopilot #4740](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4740).

## Aantoonbare tegenstrijdigheid

De bestaande geauthenticeerde ondernemersreis gebruikte `owner.outcomes.length` voor de fase **Gemeten resultaat**, terwijl de Autopilot-tegel een strengere, canonieke telling berekende: gezond en brongeverifieerd, stabiele niet-lege outcome-ID, en deduplicatie. Twee providerrecords met dezelfde outcome-ID konden daarom de cockpit ten onrechte op twee uitkomsten zetten, terwijl de Autopilot terecht één resultaat telde.

## Afgebakende correctie

Bereken `buildAutopilotEvidence(owner, heartbeat)` één keer en laat de bestaande cockpit en doelresultaatfase exact dezelfde `autopilot.outcomes` gebruiken. Zonder bewezen tenantprojectie telt de doelresultaatfase niets als bevestigd. Houd kennis/bronherkomst, voorstellen, besluiten, onafhankelijke leerbewijzen en toekomstige modelkeuzes gescheiden; verander geen rechten, databronnen, financiële voorspellingen of connectoracties.

De regressietest replayt twee brongezonde records voor één outcome-ID en controleert dat cockpit, doelstap en Autopilot alle één geverifieerde uitkomst laten zien. Ook een uitsluitend providerbevestigd maar niet uitkomstgeverifieerd record blijft zonder geclaimd doelresultaat.

## Release en bewijs

Exacte PR-head: admission, Portal/Brain regressie, Required CI, CodeQL, Netlify build. Beschermde samenvoeging en onafhankelijke Netlify productiecode plus twee verschillende werkelijk geauthenticeerde tenants A/B moeten daarna worden vastgesteld. Een codewijziging of groene build bewijst geen financiële klantverbetering. De bestaande agents, scheduler, GitHub/Supabase/Notion/Netlify autoriteiten en Brain-foutgeheugen blijven ongewijzigd. Geen direct-main-write, tweede portal of vervalste ROI.

Technische context: [OpenAI agent-evaluaties](https://developers.openai.com/api/docs/guides/agent-evals) en [OWASP AI-agent beveiligingscontroles](https://cheatsheetseries.owasp.org/cheatsheets/AI_Agent_Security_Cheat_Sheet.html).
