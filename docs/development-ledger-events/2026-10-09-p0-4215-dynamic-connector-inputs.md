# Development ledger — P0 #4215 connector-input state loss

- Date: 2026-10-09
- Obligation-ID: `p0-4215-dynamic-connector-inputs-20261009-v1`
- Parent-P0: #4215
- Failure class: `CONNECTOR_EDITOR_CHANGE_NOT_PERSISTED`
- Trigger: customer edits to visible connector source JSON and target mapping did not reach existing connector draft mutations.
- Additional audit gap: AI capability 86-score + 86-provenance leaf paths hidden behind two aggregate declarations; no external editor selector inventory.
- Corrective changes: repair existing DOM handlers, source-owned provider selector catalogue, AI path expansion from canonical catalog, explicit read-only adapter vs unenumerated standalone editor in matrix, unit test all behaviors.
- Prevention contract: protected Required matrix and tests reject missing selector or causal route; customer/provider confirmation stays unverified without real signed-in roundtrip.
- Source authority: `portal-next/connector-builder-store.js`, `portal-v2/ai-capability-catalog.js`, existing ONE BRAIN/Heartbeat; no duplicate executor.
- Evidence boundary: no real customer sessions or legally verified statutory scope; no P0 closure.
