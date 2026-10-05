# Resource Intelligence tenant isolation recovery

Datum: 5 oktober 2026

De exact-HEAD backend-gate vond een echte schema/runtime-drift: de portal filterde Resource Intelligence op `tenant_id`, terwijl `powerhouse_compliance_evidence_v1` en `powerhouse_optimization_candidate_v1` die kolom in productie niet hadden.

Deze change voegt een forward migration toe die:

- `tenant_id` fail-safe toevoegt en bestaande rijen naar `canonical` backfillt;
- tenant-indexen toevoegt;
- nieuwe optimization candidates alleen aan één aantoonbare tenant bindt;
- stale regressietestpaden naar de canonical productie-migraties verplaatst.

Er worden geen duplicate timestamp-aliases opnieuw geïntroduceerd.
