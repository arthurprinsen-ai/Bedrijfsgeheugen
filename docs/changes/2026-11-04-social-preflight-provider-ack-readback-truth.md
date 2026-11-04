# 4 november 2026 — oorspronkelijke preventieve publicatiecontrole: ACK ≠ onafhankelijke readback

Oorspronkelijke PR's #5375 en #5376 zijn MERGED; Supabase `powerhouse-content-loop` v583 is ACTIVE. Natuurlijke cron #140 werd op 3 nov 17:27 NL aangeroepen (pg_cron run #144323). In ONE BRAIN `content-closed-loop:2026-11-04` is `result.preventive` aanwezig; dit bewijst classificatie, niet vier gepubliceerde kanalen.

## Root cause / runtime
Live 4 nov 08:44Z: `linkedin_company` LIVE_PROVEN (provider waarheid); `linkedin_personal` PUBLISHED, ID aanwezig, onafhankelijke teruglezing geweigerd, `provider_truth_verified=false`, `live_proven_at=NULL`; Instagram `WAITING_ASSET`, oorspronkelijke producentclaim ontbreekt; blog `GENERATED`, `approved_at=NULL`. De oude helper gebruikte de originele idempotente terminal-functie ook voor `ready: ORIGINAL_TERMINAL_PROVIDER_READBACK`. Dat is semantisch onjuist. De select-query gaf `approved_at` en `live_proven_at` niet mee, zodat toekomstig goedgekeurde blogs opnieuw vals konden worden afgekeurd.

## Exact begrensd herstel
Gebruik uitsluitend de bestaande preventieve classifier. Bij persoonlijke/bedrijfs-LinkedIn of Instagram met `PUBLISHED`, geen `live_proven_at` en geen `provider_truth_verified=true`: `INDEPENDENT_PROVIDER_READBACK_REQUIRED`, `ORIGINAL_PROVIDER_RECONCILE_ONLY`. Dit verleent GEEN publish capability, verzendt niets opnieuw, schrijft geen fictieve provider-ID en houdt bestaande side-effect-idempotentie onveranderd. Neem de twee oorspronkelijke bewijskolommen mee in de read-only DB-select.

## Release gate
Nieuwe originele test voor ACK zonder readback en voor volledig geverifieerde livegang, plus veldprojectie-regressie; Required, BRAIN, CodeQL, beschermde merge, originele Edge-source parity, natuurlijke cron #140, ONE BRAIN-readback en exacte externe providercontrole. Tot die tijd status CANDIDATE_NOT_LIVE. De 23 ACTIVE blockers blijven 23 totdat authentiek bewijs tot afwikkeling leidt. Gehoorzaam bestaande writer-lease. Referentie: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198.

## Preventieve GitHub admission-controle
De eerste echte PR #5403-hygiene-run #41802339260 wees terecht de kandidaat af wegens ontbrekende verplichte `Base-SHA`-metadata (fout `PR_MACHINE_METADATA_INVALID:BASE_SHA_INVALID,BASE_SHA_MISSING`). De PR-body is gecorrigeerd naar exact de immutable oorspronkelijke main `3f9ab2d13c21ee3ac8dd3822e10efac1a2c70fb8`; een nieuwe synchronize-run moet de corrigeerde metadata opnieuw beoordelen. De oude rode run blijft als historisch bewijs zichtbaar. Nooit Required/CodeQL/lease uitschakelen voor deze fout.
