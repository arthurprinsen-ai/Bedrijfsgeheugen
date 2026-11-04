# Append-only GA4 Data Spine — 4 november 2026

- Oorspronkelijk root-cause incident `powerhouse|ga4|empty-success-without-resolve|20261104-v1` inmiddels source gerepareerd: beschermde PR #5400 MERGED, Edge v15 ACTIVE, oorspronkelijke request #20617 HTTP200 maar `ok=false,CONSENT_LIMITED`, Google aggregaat0; native `bg_ga4_sync=privacy_limited`.
- Nieuw gevonden downstream-probleem: oorspronkelijke Data Spine-view `producer_required=true` en strikt niet-lege bronwaarneming -> `RECOVERY_DUE`, zelfs bij onafhankelijk bewezen privacybeperking. Daarmee herhaalt watchdog onterecht technische herstelalarmen.
- Afgebakende kandidaat: uitsluitend één oorspronkelijke read-only Data Spine-view plus regressie, ONE BRAIN learning, originele continuïteitsskill, human docs en dit logboek. Geen extra scheduler, writer, providerdata of status-omzetting naar `HEALTHY`.
- Eerste uitkomst na implementatie moet `CONSENT_LIMITED/STALE` zijn zolang de nieuwste echte v15-receipt <=8 uur geldig is; bij verlopen bewijs weer `RECOVERY_DUE/STALE`, nooit schijn-versheid.
- Beveiliging: canonical service-role-only ACL, ongewijzigde 10-source scope, de bestaande echte interne datum en CAS-bronowner.
- Live-afsluiting: exact-head Required/CodeQL/full BRAIN, beschermde merge, native Supabase migratie-applied+schema ACL, daadwerkelijke view-readback, natuurlijke originele #42 en Brain-learning receipt. Geen autonome factuur of betaalde branch zonder toestemming.

## First Time Right admission negative (original Required run 41803279017)
- De echte oorspronkelijke hygiene / admission job wees de eerste PR-body correct af met `PR_MACHINE_METADATA_INVALID:SUPERSEDES_INVALID`. Oorzaak: `Supersedes: none — ...` is ongeldig voor de streng geparseerde oorspronkelijke machine-header; #5400 is reeds gemerged en géén superseded kandidaat.
- Binnen dezelfde originele PR #5404 is de pseudo-header verwijderd en vervangen door een gewone menselijke voorgangerverwijzing, zonder de machine-admission-gate af te zwakken. Deze append-only leerregistratie veroorzaakt een nieuwe exacte-head Required/CodeQL-controle. Geen productie-of-migratiewijziging uitgevoerd vóór bescherming.

## Native learning semantic gate — second historical negative
- PR Required run `41803422020` advanced past strict machine metadata but original integration closure correctly refused a learning file with `INTEGRATION_BUNDLE_CLOSURE_INCOMPLETE: semantic_learning`.
- Source cause: the new canonical `brain/learning/2026-11-04-ga4-data-spine-consent-boundary-classification-v1.json` supplied `cause/prevention/evaluation` but lacked a required machine-readable top-level `evidence` key. Production source evidence in normal prose/PR body is **not** adequate for the original permanent semantic contract.
- Corrected in the same original protected PR: added independently grounded runtime/provider, baseline and proposed state, test path and negative/positive results in `evidence`. No relaxation of original semantic gate, no direct main mutation, no status claimed live. Preserve this real misadmission as a First Time Right lesson.
