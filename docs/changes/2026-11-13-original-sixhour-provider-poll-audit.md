# 13 november 2026 — originele zesuurse providerpolls nooit meer overschrijven

## Productiebevinding en oorzakelijk bewijs

Bestaande Supabase cron #177 `bg-social-metrics-source-6h-v1` draait elke zes uur: op **12 november 2026 00:18, 06:18, 12:18 en 18:18 UTC** waren alle vier `cron.job_run_details.status=succeeded`. Het originele `bg-social-metrics-sync/index.ts` schreef onder dezelfde `powerhouse_runtime_events.dedupe_key=provider-social-metrics:2026-11-12` met `upsert`. Database-readback bevatte één dagrecord, `occurred_at=2026-11-12 18:18:25.4 UTC`. De eerdere polluitkomsten waren overschreven. Een scheduler-/HTTP-succes of dagstatus `healthy` is geen historisch pollbewijs en bewijst zeker niet de individuele ontbrekende 24/48/72h-metrics.

## Eén oorspronkelijke keten en blijvende correctie

De oorspronkelijke geautoriseerde zesuurse Edge-operator en zijn bestaande tabellen blijven eigenaar; er ontstaat geen nieuwe scheduler, provider-API, berichtverzender, queue of alternatieve bronwaarheid.

1. Begin **na bestaande providerautorisatie** met één `crypto.randomUUID` uitvoering-ID en een exacte oorspronkelijke UTC-starttijd.
2. Maak via originele pure shared module `original-provider-poll-receipt.mjs` een op echte UTC-tijd gebaseerde zesuurslotsleutel, `original_run_id`, `source_job_id=177` en eigen `dedupe_key=provider-social-metrics:run:<UUID>`.
3. Leg in **dezelfde** `powerhouse_runtime_events` een audit-event `provider_social_metric_ingest_receipt` vast met volledige oorspronkelijke `outcome`, `state=observed/error`, kwaliteitsstatus en bewijsmetadata. Return van `insert` moet exact corresponderende ID, type, status, bronrun en UTC-slot bevatten; anders fail-closed.
4. Schrijf pas daarna de **bestaande dagprojectie** `provider-social-metrics:<Amsterdam-dag>` met ongewijzigd origineel `provider_social_metric_ingest` eventtype, zodat bestaande portal-/BRAIN-consumenten niets breken.
5. Een nieuwe echte herhaaluitvoering krijgt een eigen auditbewijs maar gebruikt nog steeds originele provider-ID / originele idempotente `social_metric_snapshots`; geen nieuwe sociale post, geen tweede maker. Historische overschreven resultaten worden niet gefabriceerd. De finale leermeting en producer-/consumer-ACK blijven strikt apart.

## Controles, logging en status

- Regressies in `tests/brain-original-sixhour-provider-poll-receipt-20261113.test.mjs`: UTC-slot 00/06/12/18, DST, echte retries, ongeldige identificatie, fout-/succes-ACK, content-readback en bestaande dag-key.
- Bestaande `AGENTS.md`, social-CRO skill, ONE BRAIN machineleerrecord en development-ledger bijgewerkt.
- Live uitsluitend na beschermde Required, CodeQL, native Edge deployment, exacte productie-bundle-file-parity en het **volgende echte natuurlijke** #177 bronpoll-record **met onafhankelijke SELECT op `run:<UUID>`**. De bestaande dagprojectie blijft consumentencontract, maar een bronpoll is **geen** provider-post, publicatiebewijs, experiment, omzet of bewijs van leren.
- Bestaande 184 social-learning- en 365 BRAIN-overdrachten blijven OPEN tot originele onafhankelijke post-/venster-/leertoepassing. Registreer fouten per originele poll, niet als één dagelijkse summary; falen bij logging blijft zichtbaar via bestaande cron/Edge logs, nooit als bewezen opgeslagen receipt.

Originele incidentketen: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198; [PR #5729](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5729) heeft bronvensterselectie eerder al beschermd live gemaakt. Deze wijziging vult het **verliesvrije poll-auditcontract** aan, geen alternatieve executor.
