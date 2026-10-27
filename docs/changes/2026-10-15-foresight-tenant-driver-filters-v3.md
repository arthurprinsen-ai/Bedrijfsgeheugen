# Powerhouse Foresight — tenantgebonden contextfilter v3
Issue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4420

## Opgeleverd als broncodekandidaat
De bestaande Portal V2 Foresight toont nog steeds de 7 doeltrends en de reeds live tenant-specifieke Powerhouse-impact. De bestaande bronoverlay heeft nu drie filters: risico, kans, ontwikkeling. Een expliciete knop ververst dezelfde geauthenticeerde bron, zonder tweede loader of globale modelregisters. Filterwisseling verandert de eigen bedrijfshistorie en rekenkundige scenario's **niet**.

## Vertrouwen en herkomst
- Alleen tenantgebonden `SCORED` impactrecords van de reeds bestaande EU-gateway verschijnen als klantimpact.
- Canonieke externe signalen zonder klantbeoordeling blijven zichtbaar als *niet-klantspecifieke ontwikkelingen*, nooit als berekend rendement.
- Een impactscore is geen gebeurteniskans, financieel bedrag, causaal effect of onafhankelijk gevalideerde forecast.
- Cross-tenant data, verouderde observaties, mislukte bronrequests en ongeldige inputs worden niet als geverifieerd getoond.
- De interface hergebruikt `/api/portal-ondernemersdata` en het bestaande `portal-v2/foresight-tenant-evidence.js`, geen nieuwe scheduler, provider of database.

## Bewijs en open afhankelijkheid
Regressies: `portal-v2/tests/foresight-tenant-evidence.test.mjs` en `tests/brain-foresight-tenant-drivers-v3.test.mjs`. Nog vereist: Required CI, CodeQL, beschermd mergeproces en exacte Netlify-productie/readback.
Voor echte numerieke cross-domain modelvoorspellingen blijft apart bewijs vereist voor tenantkoppeling, modelversie, herkomst, onafhankelijke backtesting, actualiteit en autorisatie. Er zijn geen fictieve metingen toegevoegd.
