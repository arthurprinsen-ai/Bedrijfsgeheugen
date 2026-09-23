# Pricing ↔ Portal full capability parity — 2026-09-23

## Why
Lifecycle and entitlement parity were already present, but pricing still omitted multiple customer-visible Portal V2 capability domains. That made the commercial surface incomplete even though the underlying product already supported them.

## Change
`prijzen.html` now contains an explicit capability contract covering Executive Cockpit/directiesturing, strategy and execution, data and knowledge, AI and agents, Trusted Advisor assurance, compliance/regulatory intelligence, finance/people/operations, Resource & Sustainability Intelligence, and lifecycle/M&A/portfolio context.

## Anti-drift rule
Pricing may not promise unsupported Portal capability and may not silently omit customer-visible canonical Portal capability. The regression test binds the commercial claims to the source modules.
