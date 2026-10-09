# Bedrijfslek → ONE BRAIN — agent skill / integration contract
Fingerprint: `powerhouse|bedrijfslek|canonical-one-brain-ingest|v1`

1. Begin altijd met de live bestaande scans; bouw **geen** parallelle Brain, Heartbeat, CRM, scheduler, eventbus of klantprofiel.
2. Iedere ungated scan moet de complete waarde tonen vóór enige contactvraag. De score en domeinen mogen alleen zonder PII, met stabiele idempotency-key, via `/api/powerhouse-scan-ingest` worden vastgelegd.
3. `/zelfscan` krijgt `bedrijfslek_scan` als exacte source kind. `scan_inzendingen` + `powerhouse_runtime_events` + `growth_events` zijn bestaande waarheid. Geen pseudogekwalificeerde lead of omzet.
4. Unverified websitebezoekers mogen niet tot een klanttenant worden gekoppeld. Alleen geauthenticeerde klantclaim via `/api/portal-scans`, gevolgd door readback, maakt tenantcontext mogelijk.
5. POWERHOUSE mag voorspelling → actie → resultaat → leerbesluit alleen als bewezen sluiten; Heartbeat moet mislukte persistence en doorwerking als aparte degraded-obligations blijven herkennen.
6. Geen verborgen marketingconsent, valse benchmarks, kunstmatige urgentie of nieuwe uitvoerders. Marketingcontent en e-mail blijven onder canonieke kanaal-/consent- en kwaliteitspoorten.
7. Eerste tests: canonical NL URL allowlist, scan en event idempotence, geen PII, resultaat vóór POST, bestaand privileged-boundary verbod, echte provider-/database-readback en code/source SHA pariteit.

8. Portal V2 presenteert alleen tenant-bevestigde scanhistorie via de al bestaande beveiligde API. Anonieme zelfscanresultaten worden uitsluitend na succesvolle storage-receipt en expliciete claimaanvraag geassocieerd.
