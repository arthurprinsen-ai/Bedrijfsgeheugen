# Correctie: geen onterechte 'Bewezen in Brain' status

Fingerprint: `portal|relevance|health-status-false-proven|20261022-v1`. Canonical predecessor: merged PR #4673.
De actuele, nog niet onafhankelijk in productie bewezen Portal Relevantie-weergave liet een record zien als bewezen op alleen `healthy=true` en `status='ok'`. De upstream tenant-projectie liet het oorspronkelijke PROVEN-bewijs weg. De originele positieve fixture bevestigde ten onrechte juist deze fout.

Deze gerichte wijziging behoudt het bestaande `/api/brain-operating-loop` en alle bestaande daily agents en schedulers. Alleen wanneer de feitelijke tenant-identiteit, PROVEN maturity, bewezen fix, regressie en geldige production/providerreadback door de canonieke bron zijn aangeleverd, is het klantlabel bewezen. Ontbrekend bewijs, een tenant mismatch en een loutere transport-success blijven rood/onbewezen, zonder klantdata te verzinnen.

De regressie test originele portalrendering, de echte projectiemapper en positieve én negatieve fixtures. Vereist voor terminale vrijgave: exacte head Required + CodeQL, geslaagde browser/portaaltesten, beschermde merge, Netlify site source/published SHA en twee-tenant geauthenticeerde readback. Runtime ontbrekend bewijs mag geen nep-groen produceren.
