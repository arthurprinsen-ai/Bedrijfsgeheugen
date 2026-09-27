# MKB Probleemradar — signal-to-outcome contract

**Datum:** 27 september 2026  
**Fingerprint:** `mkb-problem-radar-signal-to-outcome-v1`

De MKB Probleemradar is geen nieuws- of meldingsfeed. Nieuwe of materieel gewijzigde signalen blijven eigendom van dezelfde Powerhouse-lineage totdat zij zijn gededupliceerd, aan de canonieke probleemtaal zijn gekoppeld, geprioriteerd en naar een concrete vervolgstap zijn geprojecteerd.

De operationele keten is:

`SOURCE -> EVIDENCE -> DEDUPE -> PH-Pxxx/CANDIDATE -> PRIORITY -> POWERHOUSE ACTION -> CONTENT/PRODUCT_GAP -> PUBLICATION GATE -> PROVIDER READBACK -> OUTCOME -> LEARNING`.

Een contentkans is dus tussenstaat, geen eindstatus. Bij ontbrekende productiebewezen capability wordt `PRODUCT_GAP` gebruikt. Bij content blijven evidence-, duplicate-, identity- en provider-readback-gates gelden. Uitkomsten worden teruggeschreven naar dezelfde Problem ID/evidence-lineage zodat BREIN de volgende selectie kan verbeteren.

De permanente preventieregel is `RADAR_REPORT_ONLY_IS_INCOMPLETE`: alleen melden dat een probleem of contentkans is gevonden sluit de radar-obligation niet.
