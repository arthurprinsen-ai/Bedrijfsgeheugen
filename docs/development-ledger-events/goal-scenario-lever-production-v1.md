# Development ledger — goal-scenario-lever-production-v1

- Trigger: merged Portal/Brain source was ahead of current Netlify production.
- Reused: canonical Production Source Snapshot workflow and existing Netlify production path.
- Action: refresh exact-source snapshot transport for the goal scenario lever cockpit.
- Terminal rule: do not call the feature live until exact main SHA is ready on Netlify and production readback succeeds.
