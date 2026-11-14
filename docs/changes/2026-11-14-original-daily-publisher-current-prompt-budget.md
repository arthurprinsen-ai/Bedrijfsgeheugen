# Canonical Powerhouse Daily Publisher — één actuele uitvoeringsinstructie

**14 november 2026.** Oorspronkelijke eigenaar: `agent-social-delivery-recovery`. Het bestaande dagelijkse publisher-schema (Europe/Amsterdam) en alle oorspronkelijke content- en ontvangende uitvoerders blijven hetzelfde. Bronincident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5232 .

## Aantoonbaar onderhoudsprobleem en werkelijk uitgevoerde correctie

De oorspronkelijke, ingeschakelde bestaande automation had een instructietekst van 129.285 tekens / 81 blokken. Meerdere oude en nieuwe statusmomenten werden bij iedere diagnose vooraan toegevoegd. Dat is een risico op verwarrende, verouderde of tegenstrijdige instructies; het is **niet bewezen** dat dit alleen de mislukte Instagram-publicaties veroorzaakte.

De **bestaande taak** is op 14 november gecontroleerd en op dezelfde id geactualiseerd naar één versie `P0_CANONICAL_POWERHOUSE_DAILY_PUBLISHER_V1`, 13.019 tekens (90% minder). Onafhankelijke task-readback bevestigde: taaknaam onveranderd, actief, schema/toegepaste tijdzone identiek, eerstvolgende geplande run ongewijzigd. Alleen het instructieveld werd gewijzigd. De exacte oorspronkelijke instructietekst, interne concepten en klant-/tenantdata zijn niet gekopieerd in deze openbare ontwikkelregistratie.

## Blijvende norm in bestaande agents en skills

- De recovery-agent moet vóór **en ná** iedere wijziging de originele taak, actieve status, schema, tijdzone en kerncontroles controleren; geen nieuwe publisher of kalender
- Eén actuele begrensde instructie (richtlijn maximaal 16.000 tekens) in plaats van tientallen historische statusblokken; historische oorzaken en productie-ID's horen bij de oorspronkelijke afgeschermde incidentregistraties
- Alle bestaande bevoegdheden en bewijsregels blijven: originele #120 bronradar exact 8 slots, de bron-/datum-/topic- en dedupecontrole; originele #140 Heartbeat, #171 ONE BRAIN, apart geautoriseerde Gmail #116, originele LinkedIn en Blog; exacte provider-ID/readback, Mira 0,940 en temporal 0,900, betaald mediabudget en toestemming; geen privéconcepten in openbare publicatieroutes
- Een code- of instructie-update is nooit bewijs van een verzonden bericht; ontvanger moet exact `PROCESSED` bevestigen, Heartbeat/Portal moet werkelijk gevolg en leren meten
- Onvoltooide publicaties blijven `OPEN` met oorspronkelijke eigenaar, dag, source revision en veilige next_action; de originele executor wordt niet uitgeschakeld bij herstelbare fouten.

Test: `tests/brain-original-daily-publisher-prompt-budget-20261114.test.mjs`. Beveiligde GitHub-release en origineel productie-readback zijn nodig voor de agent-/skillwijziging; geen onveilige direct-send, facturatie of tweede uitvoeringslus.

## Resultaatgrens

Deze instructie-reparatie is afzonderlijk van de Instagram-bronzoekreparatie. Verbonden OpenArt-credits en feitelijke bron-/media-/Meta-publicatie blijven door hun bestaande eigenaren te controleren. Geen toekomstige publicatie is gegarandeerd.
