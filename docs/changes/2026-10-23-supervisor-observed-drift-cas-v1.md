# Bestaande Recovery Supervisor — onafhankelijke uitvoeringsmeting (2026-10-23)

## Probleem en begrenzing
Eén succesvolle supervisor-job bewijst niet dat alle open PR's zijn hersteld, of dat de portaal-livegang is afgerond. Een 422-respons van GitHub `update-branch` is niet automatisch een bewezen stale-head-CAS-fout. De veilige synchronisatie draait reeds binnen één Recovery Supervisor: native `expected_head_sha`, één PR per cyclus, maximaal twee driftverversingen en exacte Required/CodeQL-controles.

## Implementatie
Het bestaande uurlijkse Repository Janitor-pad verzamelt met `tools/delivery/recovery-supervisor-telemetry.mjs` read-only provider-runrecords, de exacte uitgevoerde `supervise`-job, uitvoeringsduur en daadwerkelijke GitHub Actions-annotaties. Maximaal zes recente runs worden met joblogs onderzocht, met één afkapping bij providerleesfout.

Het rapport `.artifacts/powerhouse-supervisor-execution-evidence.json` telt drift per PR over **afzonderlijke runs**, en onderscheidt authenticatie-/providerafwijzingen zonder bekende oorzaak, prewrite-races, metadata-races, ontbrekend afkomstbewijs, timeout, budgetuitputting en aantoonbare reconciliatie. Pure `echo`-brontekst geldt nooit als event. Geen ontbrekende log wordt als nul incidenten voorgesteld.

## Bewijsgrenzen
`sampled_schedule_runs` en `sampled_manual_runs` zijn onafhankelijk: manual dispatch bewijst geen betrouwbare cron. Een succesvolle supervisor-jobduur is geen release-lead-time; `time_to_green_ms` en `time_to_production_ms` blijven onbekend totdat exacte beschermde PR-/release-identiteit en onafhankelijke Netlify/productie-readback kunnen worden gekoppeld. Een prestatieclaim vereist vergelijkbare baselines, geen nieuwe bottleneck of regressie en bewezen productie-uitkomsten.

## Canonieke veiligheid
Geen tweede scheduler, writer, queue of foutenregister. Het bestaande Powerhouse/Brain/Heartbeat leerpad kan deze artefacten lezen voor evidence-only aanbevelingen. CI, security, CodeQL, protected merge, Supabase en productiecontroles blijven identiek. De losstaande open PR #4786 voor de cron-offset wordt niet gewijzigd of ingesloten.

## Providerprovenance
- [GitHub update-branch REST](https://docs.github.com/en/rest/pulls/pulls#update-a-pull-request-branch)
- [Recovery Supervisor workflow](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/blob/main/.github/workflows/powerhouse-delivery-recovery-supervisor.yml)
- [Native CAS release PR #4781](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4781)

**Status:** beschermd wijzigingsvoorstel. Bewijs van geslaagde CI, merge, live Janitor-run of snelheidswinst moet na CI onafhankelijk worden gelezen.

## Exacte native afwijzingsclassificatie — aanvullende integratie
De bestaande supervisor geeft bij een geweigerde native update nu een getypeerde GitHub Actions-annotatie met HTTP-status en onafhankelijk herlezen PR-head uit. De ENIGE bestaande Janitor-collector classificeert die annotatie; de eerdere generieke afwijzing wordt voor dezelfde PR/run gededupliceerd. GitHub 422 met veranderde head blijft expliciet causality-unverified, geen verzonnen bewezen CAS-hoofdoorzaak. Regressie: bestaande tests/brain-recovery-supervisor-telemetry-v1.test.mjs. Native expected-head CAS, fail-closed leases, bounded attempts, one writer en alle protected checks blijven ongewijzigd. Geen tweede telemetry-artifact of scheduler.
