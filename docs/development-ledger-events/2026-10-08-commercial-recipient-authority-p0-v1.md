# Development ledger event — P0 recipient authority

- Date: 2026-10-08 (Europe/Amsterdam)
- Owner/lineage: ONE BRAIN / canonical P0 issue #4198
- Existing production executor: `powerhouse-autonomous-outreach` ACTIVE v20, same function slug, now with independent Gmail SENT readback delivered via merged PR #4201
- Opportunity finding: 610 v5 NBA rows; 102 with email but zero email recommendations. CRM has 605 contact email rows, none bearing explicit `human_approved=true`; no legal consent inferred from LinkedIn connection date.
- Root cause: the sender used candidate authorization evidence only indirectly and did not revalidate against trusted CRM at provider side-effect boundary. The dry-run path inadvertently executed the mutating composer and message-plan refresh.
- Candidate: `fix/p0-commercial-recipient-authority-20261008`, from exact `main` `cf2b19f75131e9c4a9556a87944b901137c04b75`.
- Code: existing `supabase/functions/powerhouse-autonomous-outreach/index.ts`; no new cron, sender or database store.
- Prevention contract: matching action/CRM recipient and person, both affirmative human-approved flags; source read failures fail closed; hold remains prepared with typed authority owner; dry-run read-only.
- Regression: `tests/brain-commercial-recipient-authority-p0-v1.test.mjs` behavioral mock tests plus order/assertion guards.
- Delivery evidence: protected CI, merge and exact production readback **NOT YET PROVEN for this candidate**. No email delivered by creating this branch.
- Scope boundary: P0 #4198 remains open for lawful candidate readiness, genuine recipient send, measured external outcomes and calibrated learning. No synthetic green claim.
