# Snapshot-cron statement_timeout — development ledger

- 2026-11-08, owner: originele cronjob 46 van de omzet-snapshot; alleen de cronopdracht wijzigt.
- Fingerprint: `delivery|supabase|snapshot-cron-statement-timeout|20261108-v1`.
- Source: opdracht van Arthur om autonoom te beslissen en op te lossen; gemeten 1,2% mislukte runs.
- Repair: `set local statement_timeout = '240s'` vóór het DO-blok.
- Known limit: job wordt niet sneller; effect pas zichtbaar in de runs na toepassing.
- Status: CODE_CANDIDATE until protected Required, CodeQL, Supabase preview and terminal closure agree.
