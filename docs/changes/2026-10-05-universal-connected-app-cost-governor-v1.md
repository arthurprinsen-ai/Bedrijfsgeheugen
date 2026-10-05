# Universal connected-app cost governor v1

Date: 2026-10-05

Powerhouse treats cost and resource optimization as a mandatory ONE BRAIN invariant for every current and future chat, agent, workflow, connector and app.

## Scope and routing

The existing `config/brain-cost-policy.json` remains the sole policy authority. New apps auto-enroll under a universal default until a platform-specific profile exists. Routing optimizes for the cheapest sufficient execution path, with reuse, cache/readback, dedupe, batching, incremental/delta work, bounded reads and bounded retries preferred before fresh provider work.

Supabase, Notion, Netlify, GitHub, Composio, DataForSEO, Tavily, Google services, Gmail, Drive, OpenArt, Placid, LinkedIn, Instagram, Salesrobot and future connectors are in scope.

## Subscription efficiency

Powerhouse may detect idle, duplicate or overprovisioned capabilities and may automatically reduce avoidable usage. Upgrades, downgrades, cancellation, paid capacity changes and billing-contract changes require explicit human approval.

## Quality floor

Cost reduction may never weaken truth, quality, reliability, security, privacy, compliance, freshness requirements, provider readback or outcome evidence.

## Canonical runtime

Existing Supabase resource authorities remain canonical: `brain_budget_usage`, `brain_cost_by_operation`, `powerhouse_resource_intelligence_daily_v1`, `powerhouse_resource_optimization_queue_v1` and `powerhouse_resource_impact_v1`. No parallel cost store is introduced.
