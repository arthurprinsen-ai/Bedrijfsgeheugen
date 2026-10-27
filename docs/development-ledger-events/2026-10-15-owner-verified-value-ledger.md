# Development ledger: geverifieerde waarde in Mijn acties

Obligation-ID: powerhouse-owner-verified-value-ledger-20261015-v1

**Gebruikersdoel:** niet alleen een dashboard maar aantoonbaar meer omzet, minder kosten en tijdwinst. Het bestaande ondernemersportaal liet wel geverifieerde outcome-tellingen zien, maar geen specifiek waardeoverzicht met onafhankelijk evidence.

**Nieuwe implementatie:** een financiële/capaciteitsprojectie in de bestaande eigenareninterface die alleen `verifiedValue.verifiedValues` uit het bestaande beveiligde Brain-operating-loop readback gebruikt. De server heeft uitvoering, verificatie en proof verplicht gesteld vóór projectie. Aantoonbare euro's en uren blijven gescheiden; dubbele records en bewijsgelijkheid worden niet opgeteld. Zonder een zekere tijdsperiode is er geen maand- of dertigdagentotaal.

**Beveiligingsgrens:** tenant-ID mismatch of ontbrekende JWT scope weigert de projectie. UI kan geen actie uitvoeren, verzenden of als gerealiseerd markeren. Geen nieuwe DB, connector of provider-send.

**Testen:** `tests/portal-v2-owner-verified-value.test.mjs`, `tests/portal-v2-owner-operating-system.test.mjs`, bestaande Brain-regressie. CI, CodeQL, merge, Netlify, production DOM en authenticated readback blijven verplicht en worden niet kunstmatig groen gezet.

**Status bij codewrite:** op GitHub featurebranch; productie nog niet bewezen totdat merge/Netlify-readback daadwerkelijk slagen.
