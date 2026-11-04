# GA4 Data Spine herstel — append-only log 2026-11-04

- Incident: `powerhouse|ga4|empty-success-without-resolve|20261104-v1`.
- Oorzaak: `bg-analytics-sync-composio` HTTP200/ok + 0 rijen; `bg_bewijs(true)`; Data Spine geen nieuwe niet-lege waarneming; geen originele herstelverplichting aangemaakt door de agent.
- Originele eigenaar: `bg-analytics-sync-composio / ONE BRAIN Data Spine`. Bestaande cron #42 blijft actief.
- Productiefeit: 2026-11-04 06:06Z 0 pagina's, 0 bijgewerkt, 0 metingen; laatste bruikbare bronwaarneming 2026-11-02 00:05Z; Data Spine `RECOVERY_DUE/STALE`.
- Uitgevoerd: originele `brain_create_obligation` plus CAS `brain_transition_obligation`; id `dee955d9-9e90-43f3-9b8a-2257bce3f1a5`; status `READY`; geen valse afsluiting.
- Bronpatch: alleen oorspronkelijke GA4 Edge collector, met onafhankelijke provideraggregaatdiagnose, no-data foutbewijs en idempotente Brain-actiesturing.
- Regressie: `tests/brain-ga4-empty-source-autonomous-owner-20261104.test.mjs`; ONE BRAIN learning en continuïteitsskill in dezelfde kandidaat.
- Preventie: sluit geen incident af bij 'API success', lege CSV, PR-merge, cron-succes of comment. Vereist échte providerwaarneming, datakwaliteit, owner-uitvoering, Productie/Brain readback en veilig leren.
- Toestand bij vastlegging: `CANDIDATE_NOT_LIVE_PROVEN`; geen herpublicatie, geen extra scheduler of ongeautoriseerde Google-aanpassing.

## Diagnosecorrectie na privacy-data-readback
- Eerste aanname "lege GA4 providerdata betekent defecte sync" bleek te algemeen. Originele `bg_interacties` (zonder gevoelige waarden te bekijken): 2026-11-02 0 menselijke sessies met toestemming / 89 zonder; 2026-11-03 0 met / 85 zonder; 2026-11-01 1 met / 88 zonder en GA4 drie providerregels. Het is dus plausibel dat GA4 terecht 0 registreert; dit is géén grond om toestemming te omzeilen.
- Dezelfde PR/owner heeft daarom de uitvoer uitgebreid: onafhankelijke provideraggregaten en minimale `bg_interacties`-toestemmingsaanwezigheid bepalen `CONSENT_LIMITED` versus echte brontechnische `NO_SOURCE_DATA`. Bij `CONSENT_LIMITED` blijft `source_data_available=false`, geen nep-GA4-groen, transport HTTP200 en privacybeperking duidelijk; bij tegenstrijdig bewijs HTTP503/errorevidence.
- Originele Data Spine krijgt geen kunstmatig vers signaal; eigen privacyarme CRO-bron blijft gescheiden. Deze wijziging was een noodzakelijk first-time-right-review van de aanvankelijke kandidaat, niet een tweede scheduler of ongeoorloofde dataverzameling.

- Extra preventiecontrole: iedere originele GA4 Bron-naar-Brain CAS-overgang behoudt bestaande obligation.evidence, inclusief eerste oorzaak en historische productieobservaties; nieuwe run krijgt `latest_observation` en `REPAIR_REQUIRED`, nooit een overschrijving van bronbewijs of een valse FULFILLED-status. Regression toegevoegd.
