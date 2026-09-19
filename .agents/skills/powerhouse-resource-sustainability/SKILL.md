# Powerhouse Resource & Sustainability Governor

Fingerprint: `powerhouse|resource-sustainability-governor|v1`

## Purpose
This skill makes cost, credits, compute, data movement and sustainability a first-class ONE BRAIN invariant. It applies to every material chat, agent, workflow, connector and delivery lane.

## Canonical authority
Read `config/brain-cost-policy.json` before material execution. Do not create agent-local budgets, cost truth stores or sustainability rules.

## Mandatory preflight
For each material obligation:
1. identify the exact obligation lineage and component;
2. identify the tools/platforms that may be called;
3. read current known quota/usage/budget state when available;
4. estimate marginal usage before execution;
5. try, in order: reuse -> cache/readback -> dedupe -> batch -> incremental/delta -> smallest capable model/tool -> cheap preflight gate;
6. refuse autonomous paid-capacity increases;
7. if cost/usage is unknown and potentially material, measure first or defer the expensive action.

## Runtime behavior
- No blind retries. Maximum identical retries follow the central policy.
- Cancel/supersede duplicate work when a newer canonical candidate exists.
- Avoid rebuilding, regenerating, rescanning or redeploying unchanged inputs.
- Prefer path-scoped CI and cheap gates before expensive browser/build/security suites.
- Prefer targeted provider reads over full workspace scans.
- Prefer hashes/readbacks to repeated external regeneration.
- Preserve correctness, security, evidence and outcome obligations; cost savings never justify weaker truth or safety.

## Platform rules
- Supabase: bounded selects, indexes, incremental processing, TTL/retention where legitimate, cache reuse, batch writes, avoid avoidable egress.
- Netlify: skip unchanged builds, scoped builds, artifact reuse, dedupe previews, compress assets.
- Notion: existing-state first, targeted reads, batch updates, no broad rescans without a concrete need.
- GitHub: cheap gates first, path-scoped CI, cancel superseded runs, reuse artifacts, bounded retries.
- Composio: use the direct specialist connector when possible, batch operations, enforce idempotency and provider readback.
- OpenArt: reuse approved assets, low-cost draft before expensive final generation where useful, generate the minimum candidate set.
- Placid: reuse templates, batch renders and skip rerender when canonical input hash is unchanged.

## Evidence
Every material run should write observation fields defined in `config/brain-cost-policy.json`, including actual usage where measurable and cost-per-verified-outcome.

## Sustainability
CO2, energy and water are treated as measured only when provider evidence exists. Otherwise use clearly labeled proxies based on compute, build/render time, bytes processed and network egress. Never present estimated footprint as exact measured footprint.

Optimization target is not merely lowest cost; it is lowest resource use per verified useful outcome while keeping truth, quality, security and reliability at least equal.

## Promotion gate
A candidate is blocked when it causes a resource-cost regression without outcome gain, unbounded retries, avoidable duplicate provider calls or an unauthorized paid-capacity increase.

Prefer a candidate when it produces an equal-or-better verified outcome with lower compute, lower egress, lower external credits or higher reuse/cache efficiency.

## Learning
Material resource outcomes are written back into the shared Brain as RESOURCE_SAVING, RESOURCE_REGRESSION, BUDGET_PRESSURE, SUSTAINABILITY_IMPROVEMENT or SUSTAINABILITY_REGRESSION. The learning loop updates relevant skills/policies so future runs inherit the improvement automatically.
