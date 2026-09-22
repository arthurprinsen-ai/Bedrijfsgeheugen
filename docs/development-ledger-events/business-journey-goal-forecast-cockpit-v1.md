# Development ledger — business-journey-goal-forecast-cockpit-v1

- Trigger: entrepreneur needs to see where the company is, where it wants to go, how far it has progressed and whether goals are likely to be reached.
- Reused: canonical Portal domain state, business-context v3, Powerhouse context projection, existing lifecycle/events/goals and Portal Overview.
- Added: destination stage, measurable goal targets, evidence-aware forecast engine, progress/pacing, milestones, Journey Map, Forecast Cards and Overview summary.
- Truth constraint: no forecast with fewer than three historical observations.
- Persistence: target stage and goal targets are stored tenant-scoped under portal.business_context and therefore flow through canonical Portal writeback.
