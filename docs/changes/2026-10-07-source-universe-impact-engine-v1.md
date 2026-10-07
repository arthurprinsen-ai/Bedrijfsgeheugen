# Source Universe & Company Impact Engine v1

## Doel

Bedrijfsgeheugen verbreedt de bestaande externe intelligence tot één evidence-first Source Universe voor 35 externe en 10 interne bedrijfsdomeinen. De capability vertaalt bronbewijs naar een traceerbare keten:

`source capability → observed evidence → signal → company impact → recommendation → canonical action → readback → outcome → measurement → learning → guard`.

## Existing-state-first

Deze wijziging bouwt geen tweede crawler, scheduler, CRM, actiequeue, outcome store of learning store. Zij hergebruikt:
- `bg_signaal_onderwerpen` en `bg_externe_signalen`;
- de bestaande Powerhouse evidence/source-observation spine;
- `connector_definitions` als bron voor connected-app capabilities;
- Company Intelligence context;
- `brain_obligations` als canonieke actie-/reviewauthority;
- bestaande outcome memory en compound learning;
- `powerhouse_runtime_scheduler_mux_v3` als periodieke schedulerauthority.

## Truth boundaries

- Source catalog capability is geen connection/live bewijs.
- Een extern signaal is geen bedrijfsspecifieke impact.
- Impactscore blijft NULL zolang probability, magnitude of exposure ontbreekt.
- Eurokans/risico blijft NULL zonder bedrijfsevidence.
- Een action candidate is geen uitgevoerde actie.
- Alleen een `READY` kandidaat met `SCORED` company impact mag via `powerhouse_materialize_intelligence_action_v1` een bestaande Brain obligation worden.
- Die materialisatie is intern en impliceert geen provider-side-effect.
- Alleen waargenomen outcomes mogen verified learning voeden.

## Portal V2

`Actueel & externe data → Omgevingsradar` toont domeindekking, source capabilities, signalen, impactstatus, bekende waarde/risico, contextgaten en volgende acties. Specialistische pagina’s voor wetgeving, arbeidsmarkt, subsidies, economie, AI/technologie, deadlines en bronnen blijven drill-downs op dezelfde intelligencecontext.

## Security

Nieuwe intelligence projections zijn server-only: RLS staat aan, browserrollen krijgen geen table grants en SECURITY DEFINER-functions zijn niet publiek uitvoerbaar. De bestaande authenticated Netlify Portal API bepaalt de tenant en valt alleen terug naar de canonieke externe baseline wanneer er nog geen tenantprojectie bestaat.

## Scheduling & assurance

Geen nieuwe cronjob. De bestaande runtime scheduler mux verwerkt de intelligence-refresh op zijn bestaande minuut-54 slot. Loop Assurance key: `external-intelligence-universe`; GREEN blijft afhankelijk van actuele evidence voor alle verplichte loopstages.

## Delivery truth

Merge of deploy is geen LIVE_PROVEN. Terminale closure vereist protected-main gates, Supabase migration/runtime readback, exact-main Netlify deployment/readback en functionele authenticated Portal/API-evidence.
