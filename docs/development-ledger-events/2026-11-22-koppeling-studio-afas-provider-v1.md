# 22 november 2026 — oorspronkelijke Koppeling Studio: van safe-test naar echte AFAS-bron

- Eigenaar: bestaande Studio, original connector handler en tenant store.
- Feitelijke nulmeting: Supabase `connector_definitions=0`, `connector_executions=0`.
- Foutoorzaak: testvoorbeelden en opgeslagen configuraties waren niet gekoppeld aan echte providerrequests, persistente tenantdata en de portaalweergave. Dit geeft een onbruikbare productervaring.
- Correctie: één live AFAS adapter, strikt vast provider-host, token in Vault, kolomtoestemming, scoped paginarouting, originele abonnements-/soevereiniteitscheck, bounded source read, atomaire snapshots met readback, execution receipt, bronwaarden op bestaande pagina en lokale revoke.
- Beperkingen: andere providers blijven nog niet bewezen; productieproef met klantaccount ontbreekt totdat token beschikbaar en geautoriseerd is.
- Regressies: `tests/brain-portal-connector-real-afas-v1.test.mjs` (SSRF, secretheaders, 401/429, PII, trusted providerproof, tenant isolation, fake sample, source readback, revoke, portal table).
- No new scheduler. No alternate writer. No automatic KPI or downstream metric claims.
- Completion gates: main + SQL migration + production provider/browser/tenant readbacks + named ONE BRAIN consumer ack for intelligent use.
