# Gemiste publicatie wordt incident — 6 november 2026

Obligation: `missed-publication-incident-20261106-v1`.

Migratie `20261106130000_powerhouse_missed_publication_incident_v1` is toegepast in productie (readback volgt na merge) en staat in het bronslot. Dry-run in teruggedraaide transactie: 12 voorvallen, idempotent. Regressie: `tests/brain-missed-publication-incident-20261106.test.mjs`.

Correctie: migratie `20261106131000_powerhouse_missed_publication_instagram_channel_v1` zet het kanaal `instagram_company` om naar `instagram` (de naam in `content_publication_obligations`). Toegepast in productie; readback: 12 echte gemiste kanaal-dagen.
