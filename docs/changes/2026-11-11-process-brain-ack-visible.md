# Procesinvoer: aantoonbaar Brain-ontvangstbewijs

Fingerprint `portal|process|authenticated-input-brain-ack-visible|20261111-v1`, 2026-11-11, oorspronkelijke issues #4215 en #4198.

De bestaande Portal V2 state/BusinessInput-route blijft de enige writer. Haar originele server ACK-event krijgt per binding de exacte source path en generatie, plus een unieke in-memory domain-scope zonder autorisatierechten. De bestaande procesweergave toont een Brain-ontvangst uitsluitend na origineel geauthenticeerd authorityStored, powerhouseFeedStored, organismImpactStored, dezelfde scope en een causale `portal.deliveryPlan` impact. Een nieuwe wijziging wist het vorige bewijs. De open procesweergave blijft open na een update. Een mislukte, stale, andere-tenant of niet-causale receipt blijft `EVIDENCE_DUE`.

**Niet afgesloten:** goedkeuring door bevoegd persoon, provideruitvoering, onafhankelijke outcome, Heartbeat-meting, learning application of cross-session replay readback. Geen geclaimde sluiting van de zeven rode hoofdlussen. Protected CI, Netlify en real-tenant readback blijven verplicht.
