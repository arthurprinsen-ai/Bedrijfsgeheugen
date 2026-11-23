# Development ledger: P0 Portal System Map / app cache divergence

2026-11-02. Original run 41428302145 proves System Map HTML mismatch (#2917, #3162). Two separate protected source repairs previously needed. Root cause: generator writing only Map and guard inspecting only Map, while HTML app.js cache query was hand-managed.

Existing original Portal/Netlify authority remains exclusive. Source repair: deterministic generator stamps map + single portal app entry; integrity gate compares exact tracked pair and same hash. Machine learning record: `brain/learning/2026-11-02-portal-system-map-atomic-app-entry-v1.json` with historical/shadow/canary. Skill updated; no independent publication/revenue claim.

Status: CANDIDATE. Required, CodeQL, full Unified BRAIN, protected merge, exact deployed SHA, authenticated Portal and no-recurrence are independently pending. Fail closed until each original gate is demonstrated.
