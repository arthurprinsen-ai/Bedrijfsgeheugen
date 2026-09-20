# Buffer rate-limit circuit — 20 september 2026

Fingerprint: `buffer-rate-limit-circuit-v1`.

## Incident
De canonical social publisher kreeg Buffer HTTP 429 met een lange `Retry-After`. De content-loop draait iedere vijf minuten. Zonder provider-circuit bleef iedere nieuwe loop opnieuw kans houden om Buffer aan te roepen terwijl de reset nog niet verstreken was.

## Root cause
De publisher gaf bij 429 alleen een retryable response terug. De reset-tijd werd niet canoniek opgeslagen en volgende runs konden daardoor de provider opnieuw raken.

## Fix
- bewaar `retry_after_seconds` en `retry_at` in `brain_records`;
- sla Buffer-audits over zolang het circuit open is;
- laat LinkedIn personal/company op `content_ready` staan;
- schrijf de obligation als `APPROVED` met `BUFFER_RATE_LIMITED` en de exacte retry-tijd;
- genereer geen vervangende tekst en maak geen tweede providerpost;
- laat Instagram-Composio onafhankelijk verdergaan;
- na `retry_at` probeert de bestaande closed-loop opnieuw.

## Veiligheid
De publication-authority en pre-publish gates blijven verplicht. Het circuit geeft nooit toestemming om direct buiten de canonical publisher te publiceren.
