# 2026-10-23 · Brain/Heartbeat: één bewijsvaste groeilus

- **Issue/owner:** #4198; bestaande commerciële outcome-/autonome verbeterautoriteit. Verbonden klantacceptatie #4585, publicatie-eigenaar #4439.
- **Observatie:** numerieke `realized_value`, `confidence` en tijdstempel alleen konden `value_known=true` maken, zonder geverifieerd provider-/klantuitkomstbewijs. Een geplande socialactie is geen publicatie; een voorspelde omzet is geen gerealiseerde omzet.
- **Wijziging:** pure, read-only `assessVerifiedGrowthLoop` binnen bestaande autonome Brain-runtime; `prioritizeByBusinessValue` accepteert waarde alleen na geverifieerde tenantgebonden doel→besluit→actie→uitkomst. Blog/social/outbound vereist echte provider-publicatie-/afleveringsreceipt. Leerbewijs + volgende beslissing is apart vereist voor `CLOSED_LOOP_VERIFIED`.
- **Preventie:** zelfgerapporteerde bedragen, ontbrekende of oude receipts, tweede tenant, toekomsttijdstempels en dubbele outcome IDs krijgen geen bekende waarderang. Geen nieuwe scheduler, tabel, agent, contentpublisher, toegekende toestemming of modelpromotie.
- **Verificatie:** de bestaande Node-regressies zijn uitgebreid met positieve en adversariële gevallen. Nieuwe tests en volledige Required/CodeQL worden op exacte head beoordeeld; geen productieclaim vóór protected merge en readback.
- **Truth boundary:** een herbruikbare rubric of regression is géén aantoonbaar extra omzetresultaat. Causale toerekening vergt een apart ontwerp en onafhankelijke uitkomstmeting.
