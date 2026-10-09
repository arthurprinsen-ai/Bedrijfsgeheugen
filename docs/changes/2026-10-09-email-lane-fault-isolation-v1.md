# P0 #4198 — e-mailuitvoering geïsoleerd binnen bestaande commerciële scheduler

9 oktober 2026. Geen nieuwe cron, geen alternatieve e-mailverzender en geen tweede CRM.

## Bevinding
- Productiejob 116 (`powerhouse-commercial-learning-v1`) bestaat en draait elk uur, zeven dagen per week.
- In de oorspronkelijke sequentiële cycle kon een vroegere fout in relatie- of commerciële intelligentie verhinderen dat bestaande geschikte e-mailacties werden aangeboden aan de bestaande e-mailwerker.
- De volledig beschikbare 23.295 connecties waren op 9 oktober vóór handmatig herstel voor die dag nog niet vernieuwd. Na uitvoering van `powerhouse_refresh_all_connection_enrichment_v1(...,0)` gaf de readback 23.295/23.295 (dit is een herprojectie van bestaande rechtmatig ingelezen bronnen, niet 23.295 externe zoekopdrachten).
- 605 connecties hadden een e-mailadres, maar de canonieke e-mailpreflight meldde `prepared:0` op 9 oktober: **geen daadwerkelijk bewijs van verzonden e-mails**.

## Wijziging
De bestaande scheduler wordt **in place** geüpdatet. Bij ontbrekende preview-cronjob wordt niets aangemaakt. Dagelijkse verrijking wordt voor de reguliere commerciële cyclus uitgevoerd, met hoogstens één volledige dagverversing en eigen exceptiongrens. De bestaande commerciële cyclus blijft de primaire eigenaar. **Alleen als die cyclus faalt**, mogen reeds bestaande en geverifieerde e-mailkandidaten door de bestaande prepare/optimize/dispatch-lane. Bij succes is geen tweede dispatch toegestaan.

## Verplicht bewijs
- Eén scheduler en één e-mailverzender.
- Harde gates voor toestemming en eerdere opt-out, druk/cooldown, menselijke goedkeuring indien vereist, inhoudskwaliteit, juiste afzender en echte Gmail-provider-ID blijven staan.
- Een dispatch-ID, concept, kandidaat, aantal connecties of providerpreflight is nooit gelijk aan `sent`.
- De volgende echte `cron.job_run_details`-uitvoering en Control Center-positie moeten gecontroleerd worden; een nog niet plaatsgevonden toekomstige run mag niet alvast als groen worden geclaimd.
- De parent-P0 blijft open voor LinkedIn persoonlijk/bedrijf, Instagram en SalesRobot én onafhankelijke commerciële outcome-readback.
