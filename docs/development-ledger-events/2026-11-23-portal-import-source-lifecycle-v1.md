# 2026-11-23 — Portal V2 CSV/XLSX bronbeheer

- **Fingerprint:** `portal|csv-excel|source-deletion-missing|20261123-v1`
- **Incident / gebruikerstaak:** de oorspronkelijke import kon de zakelijke betekenis en bronrijen tonen, maar een onjuiste of verouderde import niet veilig verwijderen.
- **Root cause:** er was geen expliciete tenantgebonden levenscyclusactie in de originele importgeschiedenis.
- **Herstel op kandidaatbranch:** bronidentiteit ID + SHA-256; bevestiging; exact tenant-recheck; bestaande Portal Domain State `patch/flush`; server-readback van volledige resterende bronlijst; UI en bestemmingsweergave via bestaande state subscriptions.
- **Voorkomen:** regressietests binnen de originele `tests/brain-portal-v2-data-import-v1.test.mjs`; Portal Living Interface-skill; geen fictief opslagsucces na `patch` zonder `load`.
- **Beperkingen:** verwijdering uit de huidige portaalgegevens is geen audit-/back-up-erasure; ONE BRAIN consumer ACK, echte klantproef en provider-koppelingen zijn niet bewezen.
- **Release:** kandidaat totdat Required/CodeQL, beschermde merge, exacte Netlify-release en onafhankelijke geautoriseerde browser-readback zijn voldaan; geen claims van volledig groen zonder eindbewijs.
