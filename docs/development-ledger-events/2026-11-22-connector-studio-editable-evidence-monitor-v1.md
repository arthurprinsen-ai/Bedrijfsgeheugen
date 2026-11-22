# 22 november 2026 — Koppeling Studio: inspecteerbare bronbewijzen en editbare syncregels

- Herkomst: oorspronkelijke Portal V2/Koppeling Studio, `connector_definitions` en `connector_executions` met bestaande AFAS-source snapshots.
- Klantprobleem: na opslaan van een connector met gewenste frequentie/richting kon de gebruiker de koppeling in de oude lijst niet aanpassen en niet onderscheiden of de ingesteld regel daadwerkelijk liep.
- Oplossing: reconstructie van custom-koppeling inclusief veld- en doeltoestemming, `PUT` met server-validatie en versienummer, expliciete invalidatie van test-/activatiebewijs, nieuw read-only `GET /health` met matching provider-receipt en source-snapshot.
- Waarheid: `SOURCE_RECORDS_VERIFIED` uitsluitend na echte provider- en serverreadback met exact tenant, versie, kolommen en hash; `PROVIDER_CONNECTION_VERIFIED` zonder bronrijen; anders `EVIDENCE_DUE`. Ingesteld schema/cron is nooit autonomously proven.
- Veiligheid: geen browser-secret, geen provider write, geen parallelle job of store, geen OAuth-bypass; werkelijke data blijft alleen in originele tenantbron.
- Regresstests: `tests/brain-connector-studio-proof-monitor-v1.test.mjs`.
- Release-evidence: Required/CodeQL, protected PR, main-commit Netlify READY en onafhankelijke browsercontrole vereist.
