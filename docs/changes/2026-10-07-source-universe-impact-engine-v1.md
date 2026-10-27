# Source Universe & Company Impact Engine v1

## Doel

Bedrijfsgeheugen verbreedt de bestaande externe intelligence tot één evidence-first Source Universe voor 35 externe en 10 interne bedrijfsdomeinen:

`source capability → observed evidence → signal → tenant impact → recommendation → canonical action → readback → verified outcome → measurement → learning → guard`.

## Existing-state-first

Geen tweede crawler, scheduler, CRM, actiequeue, outcome store of learning store. Hergebruik van:
- `bg_signaal_onderwerpen` en `bg_externe_signalen`;
- de bestaande Powerhouse evidence/source-observation spine;
- `connector_definitions`;
- Company Intelligence context;
- `brain_obligations`;
- `powerhouse_outcome_memory_v1`;
- bestaande compound learning;
- `powerhouse_runtime_scheduler_mux_v3`.

## Truth boundaries

- Source catalog capability is geen connection/live bewijs.
- Een extern signaal is geen bedrijfsspecifieke impact.
- Interne signalen vereisen expliciet tenant-scoped source evidence.
- Shared-domain/shared-exposure relaties zijn correlatie, geen causaliteit.
- Impactscore blijft NULL zolang probability, magnitude of exposure ontbreekt.
- Eurokans/risico blijft NULL zonder bedrijfsevidence.
- Een action candidate is geen uitgevoerde actie.
- Alleen READY + SCORED tenantimpact mag een bestaande Brain obligation maken.
- FULFILLED obligation is geen business outcome.
- DONE vereist verified Outcome Memory.
- Alleen waargenomen outcomes mogen verified learning voeden.

## Portal V2

`Actueel & externe data → Omgevingsradar` toont domeindekking, source capabilities/status, signalen, impactstatus, bekende waarde/risico, contextgaten en volgende acties. Specialistische pagina’s blijven drill-downs op dezelfde intelligencecontext.

## Security

Nieuwe intelligence projections zijn server-only: RLS staat aan, browserrollen krijgen geen table grants en SECURITY DEFINER-functions zijn niet publiek uitvoerbaar. De authenticated Netlify Portal API combineert canonical outside-world evidence uitsluitend met impact van de authenticated tenant.

## Scheduling & assurance

Geen nieuwe cronjob. De bestaande runtime scheduler mux verwerkt de intelligence-refresh. Loop Assurance key: `external-intelligence-universe`; GREEN blijft afhankelijk van actuele evidence voor alle verplichte loopstages.

## Delivery truth

Merge of deploy is geen LIVE_PROVEN. Terminale closure vereist protected-main gates, Supabase migration/runtime readback, exact-main Netlify deployment/readback en functionele authenticated Portal/API-evidence.
