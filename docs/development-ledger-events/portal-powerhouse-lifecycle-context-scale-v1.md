# Development ledger — portal-powerhouse-lifecycle-context-scale-v1

- Trigger: website lifecycle pricing was expanded to growth, recovery, crisis, buy-side, sell-side and portfolio, and the user required the same logic to exist inside Portal/Powerhouse rather than only on the pricing page.
- Existing state reused: Scale entitlement policy, executive cockpit, decision engine, Strategy DNA, Impact Engine, Scenario Simulator, Capability Graph, Due Diligence, Exit, BCG, roadmap, actions, outcomes/evidence and audittrail.
- Added: canonical Brain lifecycle context, portal projection, three explicit context workspaces, contextual Due Diligence/Exit routing, Scale core-workspace policy, decision/executive context projection.
- No duplicate state store introduced. Context is derived from existing portal/brain state and runtime records.
- Default growth context is explicitly unproven when no evidence exists.
- Tests: canonical brain context, portal lifecycle rendering and Scale entitlement semantics.
