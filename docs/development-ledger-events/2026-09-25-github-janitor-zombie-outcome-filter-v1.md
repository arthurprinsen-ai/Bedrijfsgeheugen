# 2026-09-25 — GitHub janitor zombie-run / outcome-filter

- Actuele main vóór repair: `9274dafb26d22f03e9f22fccac4f7be3ab125be2`.
- Repository Janitor run `36096472079` faalde op `JANITOR_CANCEL_FAILED:34714400623:queued` nadat cancel, force-cancel en delete alle drie waren geweigerd.
- De betrokken queue is historisch: PR #1444 is al gemerged; negen runs op `fix/supabase-migration-history-integrity` staan sinds 2026-09-12 vast.
- Outcome Obligation Sweep run `36096432154` werd getriggerd door geannuleerde Production Release Readback run `36096042698` en faalde tijdens verplichte artifact-resolutie.
- Repair: janitor registreert provider-blocker en vervolgt cleanup; outcome evidence accepteert alleen source conclusion `success`.
- Veiligheidsinvariant blijft staan: current main en current open-PR head worden nooit als stale cleanup-doel behandeld.
