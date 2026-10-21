# Development ledger event — 21 oktober 2026 — Portal context

- **Fingerprint:** `portal|contextual-business-journey|one-organism|v1`
- **Issue:** [#4547](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4547), afhankelijkheid [#4215](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215).
- **Signaal:** bestaande Winstnavigator geprogrammeerd maar niet zichtbaar vanuit `app.js` en ondernemersflow; bestaande `portal-impact` reviewmeldingen niet consistent bruikbaar op elke detailpagina; platforms als lijst niet hetzelfde als actuele klantsynchronisatie.
- **Oorzaak:** UI-entrees en technische systeemlijsten stonden los van de bestaande, geauthenticeerde source/ACK/event-keten.
- **Fix:** bestaande navigator mounten; één `connected-journey-model.js` gebruikt op elke geregistreerde route en bestaande `entrepreneur-home` detailgids; feitelijke providerstatus alleen met tenantgebonden timestamp/bronbewijs; pending versus ACK expliciet.
- **Authority:** bestaande portal State/Brain ACK, Powerhouse readmodel, Heartbeat-observatie, route registry; geen nieuwe datastore, cron, connector of cross-tenant fetch.
- **Preventie:** `portal-v2/tests/connected-journey.test.mjs` + canonical Brain replay; login/demo/test met twee gescheiden tenants, geen verzonnen data.
- **Status:** source candidate. Geen release- of providerreadback als uitgevoerd claimen.
- **Follow-up:** echte twee-tenant E2E incl. P0 #4215; volledige UI-compleetheid onder #4547.
- **Rollback:** revert alleen feature-entrée als regressie optreedt; RLS, provider-auth, bestaande scheduler/Heartbeats blijven intact.
