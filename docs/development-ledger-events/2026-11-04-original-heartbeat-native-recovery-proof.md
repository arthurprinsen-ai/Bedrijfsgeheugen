# Append-only incident ledger — original Heartbeat recovery source consumption

- Datum/zaak: 2026-11-04, issue https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198.
- Huidige bron: native productie `powerhouse_recovery_review_truth_v1()` geeft 307 afgesloten reviews en 306 expliciet `UNRESOLVED`. Alleen `service_role` mag de functie uitvoeren.
- Oorzaak: de bestaande recovery-control-plane-functie heeft geen actieve eigen cron; oorspronkelijke scheduler #171 draait `terminal-autonomous-reconcile` wel, maar zijn mux-taakreceipt geeft alleen `ok` en verstreken milliseconden zonder originele recovery-outcome-bron.
- Eigenaar: oorspronkelijke ONE BRAIN/Heartbeat runtime-mux. Geen nieuwe schrijver of scheduler.
- Minimale kandidaat: bestaande service-role-only `public.powerhouse_runtime_mux_task_v1(text,text,integer)` verzamelt oorspronkelijke JSONB terminal-reconciler-receipt, eist exact contract, leest bestaande geaggregeerde recovery-functie en voegt dit toe aan hetzelfde `task_results`. Ontbrekend contract wordt `ok=false`. Bestaande ONE BRAIN policy-fouttak blijft beschermd.
- Hypothese en meting: vóór deze change natuurlijke taak zonder `recovery_review_truth`. Na release twee echte natuurlijke slots met herstelbron; telt 306 expliciet onopgelost totdat individuele providerbewijzen beschikbaar zijn. Nooit 306 nulmaken door een statuswijziging.
- Regressie: `tests/brain-original-heartbeat-native-recovery-proof-20261104.test.mjs`. Brain-leren: `brain/learning/2026-11-04-heartbeat-native-recovery-proof-consumption-v1.json`.
- Risico- en securityregels: geen agent/scheduler naast oorspronkelijke #171, geen publiek EXECUTE, geen ruwe privédata, geen side-effect-replay, geen publicatie zonder provider-ID of consent.
- Release: exacte security/Required/BRAIN/CodeQL/Supabase-preview, beschermde merge, productieledger, broncode en ACL, echte natuurlijke #171 taakreceipts, historische incidenten apart open.
- Status bij aanvang: PATCH_CANDIDATE_NOT_PRODUCTION_VERIFIED. Dit log is géén bewijs van livegang.
