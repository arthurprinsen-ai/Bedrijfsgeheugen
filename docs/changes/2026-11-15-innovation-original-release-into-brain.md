# Automatische oorspronkelijke innovatie-releaseoverdracht naar ONE BRAIN

Datum 15 november 2026. P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198.

## Geobserveerd probleem

De eerste aantoonbaar autonome engineering-run https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/43754864334 bouwde in dezelfde bestaande Powerhouse-workflow daadwerkelijk een broncodewijziging, tests, een leerrecord en originele PR https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5908.

De beschermde PR werd pas na Required, CodeQL, historische tests, canary en alle documentatie gemerged in GitHub main `60c41d4813f3bc0d3a3ef9fcdca095597221a0da`. Netlify publiceerde exact die SHA als deploy `6afa1140fce862102329274e`. Bestaande productiecontrole https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/43756362047 was succesvol.

Toch bevatte de oorspronkelijke ONE BRAIN-operatie `56e16919-6275-4c2e-9208-6ac0c8a29a29` aanvankelijk alleen een PR-candidate receipt; de productierelease had geen automatische terugmelding. Het eerste releasebewijs is daarom operator-ondersteund vastgelegd via de bestaande `public.brain_transition_operation`-versie-CAS, onafhankelijk readback, operatieversie 7→8. Dat bewijst géén automatische toekomstige afhandeling.

## Bouw: één en dezelfde oorspronkelijke uitvoeringsketen

Na de reeds bestaande `Production Release Readback` stappen, *alleen bij bewezen exact `LIVE_VERIFIED`*, controleert de nieuwe `scripts/brain/innovation-original-code-production-receipt.mjs` of deze GitHub-main commit door de oorspronkelijke engineering-agent vanuit een brongebonden `writer/innovation-<candidate>-<run>`-PR werd gemerged. Hij vergelijkt origineel candidate-ID, operation-ID, SHA256, source revision, eigenaar, idempotency/correlation, verplichte PR identity, originele GitHub merge SHA, de bestaande productierelease-uitkomst en de onafhankelijke live `release.json` Netlify deploy identity. Andere deployments zijn geen innovatie-uitvoering.

Bij volledige overeenstemming schrijft **de bestaande productiecontroller** `original_code_production_readback` in dezelfde oorspronkelijke `brain_operations`-rij via de originele CAS-RPC. De rij blijft `PLANNED`, originele verplichting `OPEN`, totdat echt gebruik/consumer ACK, Heartbeat-effect, gerealiseerde financiële impact en toegepast leren onafhankelijk zijn bewezen. De oorspronkelijke inhoud en historische PR receipt blijven behouden. Volledige replay van hetzelfde releasebewijs is idempotent.

Er wordt geen extra scheduler, Brain, queue, producer, autorisatieomweg, direct externe sender of database geïntroduceerd.

## Onafhankelijke acceptatie

Verplichte regressie `tests/brain-innovation-original-code-production-receipt-20261115.test.mjs` bewijst dat exact PR/deploy/source wordt geaccepteerd, onjuiste metadata/netlify/owner/status faalt, replay geen duplicaat schrijft en no-ACK/no-ROI bewaard blijven. Deze regressie is onderdeel van de bestaande verplichte automatiseringsstraat. De code is pas live na beschermde PR-merge met Required/CodeQL en onafhankelijke productie-readback. Geen van de 14 originele innovaties wordt door deze technische fix automatisch gesloten.

Rollback: beschermde source-revert van workflow en bijbehorende reconciler, originele ONE BRAIN-geschiedenis en releasebewijzen behouden.
