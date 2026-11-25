# Productie-readback volgt de nieuwe portaalcategorie

Het hoofdportaal is via beschermde PR #4347 op 12 oktober gepubliceerd als Netlify deploy `6accb2b9f4de3f939ce63151`, SHA `51bdf9deec401c0f59e548a938f4b11542c1703d`. Onafhankelijke live HTML-readback bevestigt de vijfstappen-ondernemingssturing en de standaard verborgen demo-KPI's.

De post-deployment browsertests rapporteerden 13 geslaagd, 2 mislukt, 1 overgeslagen. Beide mislukkingen zochten de oude letterlijke titel `Portal V2 bevat alle portalonderdelen standaard` in `tests/integration/portal-v2-production-full-parity.spec.js` en `tests/integration/portal-v2-production-standalone.spec.js`. De nieuwe klantgerichte titel is `Alle onderdelen van je ondernemingssturing`.

Deze test-only correctie verandert de goedgekeurde bedrijfspositionering **niet**, maar accepteert de nieuwe titel en verifieert expliciet één gebonden sturingscyclus en de vier standaard verborgen voorbeeldpanelen. De bestaande uitsluitingen voor legacy portaalverkeer, klantgebonden pagina's, auth, mobiele routes en volledige parity blijven actief.

De Supabase Preview-melding `Remote migration versions not found in local migrations directory` valt buiten deze testcontract-correctie: PR #4347 had geen SQL-migraties; behandel die database-ledger drift afzonderlijk, zonder een fictieve SQL-migratie toe te voegen.

Vereist: protected CI, preview, exact Netlify main release en herhaalde onafhankelijke production DOM readback.
