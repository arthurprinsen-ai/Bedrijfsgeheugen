# Semantic parity exact-release obligations

Fingerprint: `portal-v2-semantic-parity-release-v1-obligations`

1. PR-head en merge-candidate moeten dezelfde semantische paritytests draaien.
2. Canvassen mogen pas van `implemented` naar `verified` wanneer productie alle zes complete views toont en tenant-scoped writeback na heropenen server-bevestigd blijft.
3. Strategie/BCG blijft als capability `contracted` zolang alleen BCG aantoonbaar is hersteld; de gehele strategiecapability wordt pas `implemented` wanneer de volledige legacy strategiemodellenset semantisch is gedekt.
4. Production evidence wordt uitsluitend aan de exacte merge-SHA gekoppeld.
5. Assurance-records die repositorybestanden als bewijs noemen moeten fail-closed gaan wanneer die bestanden niet bestaan.
