# 29 oktober 2026 — productie-browserreadback faalt op Netlify-alias, echte productiedomein met SHA-fence

**Obligation:** `delivery|portal|immutable-netlify-alias-browser-403-or-no-response|20261029-v1`.

## Aantoonbaar incident

Protected merge [#5115](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5115) staat live op Netlify commit `481c2903ceba2f4e9163f62a4ec8925468b21a3b`, deploy `6ae3435d4b10026685b95242`. De `production-dom-readback`-job faalde twee keer: eerst één HTTP 403 op de Netlify immutable browserhost bij `/klantportaal?klant=demoAI` voor Strategiemodellen, bij herhaling één `no response` in full-parity browsercontract. Beide runs hadden 14 geslaagde browserchecks. Onafhankelijke HTTP-requests naar dezelfde immutable én echte publieke route gaven HTTP 200. De precieze infrastructuur/antibot-root-cause is **niet bewezen**.

## Veilig, kleiner dan een bypass

Voor een **main**-release is `https://www.bedrijfsgeheugen.nl` de echte klantproductieroute. Voordat Playwright deze host gebruikt, haalt een nieuwe begrensde helper beide onafhankelijke `release.json`-manifests op — **immutable Netlify deployment + echte publieke domein** — en eist exact hetzelfde al gepinde `commit_ref`, `deploy_id`, `context=production` en `contract=BRAIN-DELIVERY-v2`. Na de browser-/visualisatieproeven wordt deze identiteit opnieuw gecontroleerd. Bij enige HTTP 401/403, onbekende identiteit of SHA-drift faalt CI; geen test wordt overgeslagen of op groen gedwongen. De immutable bron wordt nog steeds als uitvoerings-/providerherkomst geverifieerd. De visual baseline blijft de beschermd gemergde PR-source.

Beveiliging en kwaliteit: geen auth-rechten verruimd, geen token in browser, geen SSO-bypass, geen schijn-HTTP 200, geen dubbele scheduler of Netlify forced deploy. De helper raakt uitsluitend de bestaande GitHub testworkflow en `tools/ci`; er is geen productieruntime-wijziging of productie-DB-migratie.

## Verificatie / status

- Gerichte tests: geslaagd voor perfecte exact-sha-identiteit, echte publieke SHA-drift, 403, ongeldige immutable ID en volledige browser-/visuele workflow-contract.
- Materiële learning/writeback-/documentatiecontrole en beschermde GitHub Required+CodeQL vóór merge.
- **Nog nodig:** beveiligde merge van deze CI-only correctie en echte `workflow_dispatch` van de bestaande DOM-readback voor het reeds gepubliceerde `481c...b21a3b` met merged PR `#5115`. Pas na complete Playwright suite + approved screenshotvergelijking + identieke SHA na afloop krijgt dit incident een bewezen groen status.
