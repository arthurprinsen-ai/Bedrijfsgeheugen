# Audit: Mira media history erasure and LinkedIn unique-source exhaustion

- Date: 2026-10-29 UTC, owner: canonical social recovery agent / existing Instagram media router and ONE BRAIN.
- Existing incident: #4439; new fingerprint: `mira|media|ensure-rpc-erases-claimed-history|20261029-v1`.
- Actual observation: Mira frame identity 0.900 < enforced 0.940; original OpenArt history already rejected. In earlier runs existing ensure function could erase claimed history after a router rejection on WAITING_ASSET.
- Root cause independently confirmed with production `pg_get_functiondef`: the old UPSERT protected only status or asset_url/openart_resource_id, not openart_history_id, attempts, proof or explicit error.
- Remediation: modify the same function through protected migration, guard all claimed/rejected rows, preserve stable original job ID, preserve original one-shot publisher and service-role-only access.
- Existing source gate for LinkedIn: 80 eligible public signals, 3 with recent publication date, 0 pass full personal content quality/date/topic contract. No forced source insert or fabricated entrepreneur story.
- Test: `tests/brain-mira-ensure-claim-monotonicity-20261029.test.mjs`.
- Publication proof: Instagram provider ID absent; LinkedIn personal 2026-10-29 provider ID absent. Company LinkedIn existing proof is unrelated and must not be republished.
- Release proof: PENDING; protected PR checks and production SQL/readback must update this ledger before any live claim.
- Portal: no false green, expose missing data/source and provider proof as blocked action requirements; independent success needed to close.
