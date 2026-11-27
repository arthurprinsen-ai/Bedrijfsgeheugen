# Portal V2 — semantische CSV/Excel-bronregistratie, 22 november 2026

- Original lineage: bestaande Portal V2 → Portal Domain State → BusinessInput → ONE BRAIN → Powerhouse/Heartbeat.
- Fingerprint: `portal|uploaded-file-semantic-purpose-missing|20261122-v1`.
- Waargenomen gat: CSV/Excel-import van #6108 kan bestandsgegevens behouden maar geen bruikbaar, beoordeeld bedrijfstype, doel, korrelgrootte, kolomrol, beoogd domein of privacybasis vastleggen.
- Veilige oplossing: verklaarbare suggesties en één bevestigingsstap in dezelfde importdialog. Alle metadata gaat als deel van exact dezelfde tenantgebonden geïmporteerde bron; bestaande writer/ACK en readback blijven verplicht.
- Regressie: `tests/brain-portal-v2-import-context-v1.test.mjs`. Test onbekende gegevens, verifieerbare doelen, composite-kolomnamen, missing values, duplicaten, echte privacyrestricties, role mismatch, read-only contract en ongewijzigde canonical writer.
- Geen nieuwe scheduler, agent, parallelle opslag, uitvoer of automatische KPI-mutatie. Ingevoerde data leidt niet zelfstandig tot financiële resultaten.
- Uitrolbewijs vereist: exact-head Required, CodeQL, beschermde merge, Netlify exact SHA, werkelijke klantimport met verificatie van semantische waarden en ONE BRAIN consumer receipt.
- Status bij kandidaat: **NIET BEWEZEN LIVE**; registratie geeft geen toestemming om dat claimen.
