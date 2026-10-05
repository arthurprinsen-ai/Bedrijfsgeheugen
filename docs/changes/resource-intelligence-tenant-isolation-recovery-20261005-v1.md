# Resource Intelligence tenant isolation recovery

Datum: 5 oktober 2026

De exact-HEAD backend-gate vond een echte schema/runtime-drift: de portal filterde Resource Intelligence op `tenant_id`, terwijl `powerhouse_compliance_evidence_v1` en `powerhouse_optimization_candidate_v1` die kolom in productie niet hadden.

Deze change voegt een forward migration toe die:

- `tenant_id` fail-safe toevoegt en bestaande rijen naar `canonical` backfillt;
- tenant-indexen toevoegt;
- nieuwe optimization candidates alleen aan één aantoonbare tenant bindt;
- stale regressietestpaden naar de canonical productie-migraties verplaatst.

Er worden geen duplicate timestamp-aliases opnieuw geïntroduceerd.

## Production readback

De protected merge van PR #3749 is als merge-SHA `ddeff40104e8e16cd1683171071bd523393e29c8` op `main` terechtgekomen. De gereviewde migration-SQL is daarna via de officiële Supabase migration-route toegepast. Supabase registreerde die productie-uitvoering canoniek als:

`20261005160410_resource_intelligence_tenant_isolation_recovery_v1`

De repository gebruikt daarom voortaan exact die production identity. De eerdere lokale timestamp `20261005154500` is geen aparte migration en wordt niet als executable alias behouden.

Production readback bewees bovendien:

- `tenant_id` bestaat op `powerhouse_compliance_evidence_v1`;
- `tenant_id` bestaat op `powerhouse_optimization_candidate_v1`;
- beide tenant-indexen bestaan;
- er zijn geen lege of NULL tenant keys in beide authorities.

Hiermee is de migration identity gekoppeld aan de daadwerkelijk toegepaste productiehistorie in plaats van aan een lokale timestamp-alias.

