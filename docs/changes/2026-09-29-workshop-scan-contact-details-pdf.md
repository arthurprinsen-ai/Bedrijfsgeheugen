# Workshopscan — naam, e-mail en telefoon in persoonlijk PDF

## Wijziging
De workshopscan vraagt nu verplicht om:
- bedrijfsnaam;
- contactnaam;
- e-mailadres;
- telefoonnummer;
- aantal medewerkers;
- expliciete toestemming.

De persoonlijke scan-PDF toont de contactnaam, het e-mailadres en telefoonnummer direct onder de bedrijfscontext. Dezelfde contactgegevens worden opgeslagen in de private service-role-only `workshop_portal_intakes` en geprojecteerd naar de vooraf gevulde canonical-brain portalstate.

## Privacygrens
Contactgegevens zijn PII. Zij blijven buiten `growth_events`, publieke benchmarks en aggregate learning. De bestaande RLS/revoke/grant-beveiliging op `workshop_portal_intakes` blijft leidend.

## Canonieke lineage
`/scan → submission_key → scan_inzendingen + private workshop_portal_intakes → persoonlijke PDF → canonical-brain portalstate → authenticated claim`.

Er wordt geen tweede klantrecord, tweede scan of parallelle contactdatabase aangemaakt.
