# Source Universe & Company Impact Engine v1

## Doel

Bedrijfsgeheugen volgt niet alleen losse nieuwsitems. De capability maakt van interne en externe bronnen één evidence-first beslisketen:

`bron → bewijs → signaal → bedrijfsspecifieke impact → aanbeveling → bestaande actie-authority → outcome → learning`.

## Dekking

De taxonomie bevat 45 domeinen: 35 externe omgevingsdomeinen en 10 interne bedrijfsdomeinen. De source catalog bevat officiële, markt-, research-, community/provider- en interne connectorbronnen. Een catalogusrecord betekent **mogelijke dekking**, niet dat de bron live gekoppeld is.

## Bestaande authorities die worden hergebruikt

- `bg_signaal_onderwerpen` en `bg_externe_signalen` voor de bestaande externe intelligence-ingang.
- `powerhouse_evidence_source_observations` / `powerhouse_source_observation_v1` voor raw evidence.
- bestaande company graph voor bedrijfsspecifieke context.
- bestaande Brain/action/obligation authorities voor echte uitvoering.
- bestaande realized value / outcome / compound learning voor gemeten resultaat en leren.
- `powerhouse_runtime_scheduler_mux_v3` als enige schedulerroute.

## Nieuwe projections

- `powerhouse_intelligence_domain_registry_v1`
- `powerhouse_intelligence_source_catalog_v1`
- `powerhouse_intelligence_signal_projection_v1`
- `powerhouse_intelligence_company_impact_v1`
- `powerhouse_intelligence_action_candidate_v1`
- `powerhouse_intelligence_snapshot_v1`

Deze zijn projections/read models. Ze vervangen geen bestaande authority.

## Impactmodel

Een signaalscore gebruikt externe evidence zoals relevantie, brontrouw, bevestiging, versheid en confidence.

Een bedrijfsspecifieke impactscore wordt pas berekend wanneer minimaal **waarschijnlijkheid, omvang en exposure** bekend zijn. Relevantie, urgentie en bronconfidence verfijnen de score. Ontbrekende kerncontext resulteert in `NULL`, niet in een optimistische default.

Eurobedragen worden nooit uit de lucht gegrepen. Kansen- en risicowaarde blijven `NULL` totdat evidence ze ondersteunt.

## Portal

Portal V2 krijgt **Actueel & externe data → Omgevingsradar**. De radar toont:
- volledige domeindekking;
- catalogus versus actieve evidence;
- actuele signalen en signaalscore;
- impactstatus en bewezen impact;
- kandidaat-acties;
- bekende kans- en risicowaarde;
- projection scope (`canonical` of tenant).

De specialistische pagina’s voor wetgeving, arbeidsmarkt, subsidies, economie, technologie, deadlines en bronnen blijven bestaan.

## Scheduling en assurance

Er wordt geen nieuw cronjob aangemaakt. De bestaande runtime scheduler mux voert de intelligence-refresh uit op zijn bestaande minuut-54 slot.

Loop Assurance key: `external-intelligence-universe`.

Verplichte stages blijven:
`input → decision → action → readback → outcome → measurement → learning → guard`.

Een nieuwe signal-refresh bewijst dus niet automatisch outcome of learning; de loop blijft terecht AMBER zolang echte downstream evidence ontbreekt.

## Security

De projectietabellen:
- hebben RLS;
- zijn niet direct toegankelijk voor `anon` of `authenticated`;
- worden alleen server-side gelezen via de bestaande geauthenticeerde Netlify Portal API;
- gebruiken expliciete service-role grants;
- geven SECURITY DEFINER functies niet publiek vrij.
