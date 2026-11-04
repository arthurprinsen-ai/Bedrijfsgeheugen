# Append-only GA4 Data Spine — 4 november 2026

- Oorspronkelijk root-cause incident `powerhouse|ga4|empty-success-without-resolve|20261104-v1` inmiddels source gerepareerd: beschermde PR #5400 MERGED, Edge v15 ACTIVE, oorspronkelijke request #20617 HTTP200 maar `ok=false,CONSENT_LIMITED`, Google aggregaat0; native `bg_ga4_sync=privacy_limited`.
- Nieuw gevonden downstream-probleem: oorspronkelijke Data Spine-view `producer_required=true` en strikt niet-lege bronwaarneming -> `RECOVERY_DUE`, zelfs bij onafhankelijk bewezen privacybeperking. Daarmee herhaalt watchdog onterecht technische herstelalarmen.
- Afgebakende kandidaat: uitsluitend één oorspronkelijke read-only Data Spine-view plus regressie, ONE BRAIN learning, originele continuïteitsskill, human docs en dit logboek. Geen extra scheduler, writer, providerdata of status-omzetting naar `HEALTHY`.
- Eerste uitkomst na implementatie moet `CONSENT_LIMITED/STALE` zijn zolang de nieuwste echte v15-receipt <=8 uur geldig is; bij verlopen bewijs weer `RECOVERY_DUE/STALE`, nooit schijn-versheid.
- Beveiliging: canonical service-role-only ACL, ongewijzigde 10-source scope, de bestaande echte interne datum en CAS-bronowner.
- Live-afsluiting: exact-head Required/CodeQL/full BRAIN, beschermde merge, native Supabase migratie-applied+schema ACL, daadwerkelijke view-readback, natuurlijke originele #42 en Brain-learning receipt. Geen autonome factuur of betaalde branch zonder toestemming.
