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


## GitHub runner/queue budget

Fingerprint: `github|actions-queue-pressure-governor|predict-before-dispatch|v1`.

GitHub runner minutes and queue slots are governed resources. Before material repository writes or dispatches, record current pressure and projected run fan-out. Soft pressure is 12 active / 10 queued; hard pressure is 20 active / 20 queued; projected fan-out above 6 from one action must be reduced before execution.

Prefer one atomic commit for one borging package, path-scoped gates and existing exact-head work. Under hard pressure, optional and recovery fan-out is forbidden until backlog is reduced. A recovery mechanism that consumes more runner capacity than it releases is a RESOURCE_REGRESSION.

## Universal connected-app cost governor — mandatory inheritance

Fingerprint: `powerhouse|universal-connected-app-cost-governor|v1`.

This rule applies to **every current and future chat, agent, workflow, connector and app** attached to Powerhouse/ONE BRAIN. A connector is not exempt because it is new or absent from the explicit platform list.

Before any material external read/write or compute-heavy action:
1. apply `config/brain-cost-policy.json`;
2. identify measurable provider meters and current/recent usage when available;
3. compare equivalent execution routes and choose the **cheapest sufficient route** that preserves or improves quality, reliability, security, evidence and outcome;
4. reuse -> cache/readback -> dedupe -> batch -> incremental/delta -> bounded query -> smallest sufficient capability -> execute once -> verify once;
5. record actual usage/cost where measurable and cost-per-verified-outcome;
6. feed material savings/regressions into the existing resource optimization and learning loop.

New connected apps are auto-enrolled under `universalPlatformDefault` until a platform-specific policy exists. Their first material use must register meters and optimization levers; creating a parallel budget/cost store is forbidden.

Cost optimization covers both variable usage and subscription efficiency. Agents may autonomously reduce waste, calls, builds, storage growth, egress, retries, generations and duplicate work. Agents may **not** autonomously upgrade/downgrade/cancel paid plans, accept a new billing contract, or buy capacity; those remain a human financial boundary.

A cheaper route is forbidden when it lowers truth, outcome quality, reliability, security, privacy, compliance, readback evidence or required freshness. The optimization target is total resource cost per verified useful outcome, not lowest nominal unit price.



## Kansenradar original-owner auth and credits guard (3 November 2026)

INCIDENT_PROTOCOL: agents-skills-register-and-self-fix-v1. The existing Kansenradar daily source is one protected Supabase Edge v12 and the original job #18 `bg-kansenradar-dagelijks` (06:00 UTC). Original production release run #41628384628 failed because its source was missing in `supabase/config.toml`. A security review also proved the Edge accepted POST without an authorized scheduler identity while using a privileged service-role client. Preserve original provider `verify_jwt=false` only together with an independently tested mandatory `x-powerhouse-token` gate, resolved from existing `public.bg_geheim('powerhouse_daily_scheduler_token')` **before privileged work**. The sole cron command must reference that secret at runtime, never store the value in the job command or repo. Preserve one active cron ID, schedule, canonical use-case `supabase-bg-kansenradar-v1`, Anthropic provider approval and the no-blind-credit-retry rule. Record auth failures, provider credits and missing function config as three separate source classes with first-party ONE BRAIN receipts, exact SHA, root cause, prevention and next natural recurrence check. Never make a paywall, reauthorization or billing decision autonomously; owner-only action notification must include verified direct provider billing URL if one exists, not a generic issue link. No false GREEN until original edge source/version, unauthorized rejection, authorized call and actual downstream outcome are independently proven. Parent original main repair evidence: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/41628384628 .


## 3 november 2026 — Kansenradar gemengde nieuwsbron mag geen onjuiste post of DM opleveren

INCIDENT_PROTOCOL: agents-skills-register-and-self-fix-v1. Het oorspronkelijke geautoriseerde Kansenradar-v15 OpenAI-outputcontract draait correct en produceerde Notion BG-505, maar onafhankelijke Notion-readback toonde een titel over vakantievluchten gekoppeld aan een haak/samenvatting over Invest-NL/agritech (nieuwsupdate met meerdere artikelen). Technische GREEN is geen inhoudelijk publicatiebewijs. De desbetreffende Notion-conceptpagina `40dda36a-ac8a-8105-832d-de23622e631a` heeft `Genereren=nee`, `Publicatiecheck=Geblokkeerd`; twee gekoppelde outreach-concepten staan in oorspronkelijke `powerhouse_sales_actions` op `skipped`. Geen herstel door simpelweg publicatiegroen in te vullen.

Originele Kansenradar moet vóór OpenAI-interpretatie, Notion-briefing en DM-voorstellen broncoherentie controleren: nieuws-overzichten/nieuwsupdate met meerdere items bevatten geen eenduidige titel-naar-haak-binding en mogen niet automatisch één verhaal worden. `supabase/functions/_shared/kansenradar-source-coherence-gate.mjs` sluit zulke bekende multi-story-urlpatronen en invalide URL's fail-closed uit; noteert dat dit slechts één risicoklasse afdekt, geen semantische garantie. Afwijzing wordt via oorspronkelijk `bg_bewijs(false,...,'VALIDATION')` gelogd, mét concrete URL en foutcode; bij uitsluitend afgewezen bronnen geen concept, DM of valse inhoudelijke GREEN. Keur alleen originele bronfragmenten vrij na extra onafhankelijke redactionele controle. Herstel nooit door de bron te vervalsen, duplicaatcontrole uit te zetten of onaangetoonde claims te publiceren.

Centraal incident `powerhouse|content|kansenradar-source-title-hook-mismatch|20261103-v1`, originele Notion-bewijspagina https://app.notion.com/p/40dda36aac8a8105832dde23622e631a. Vereiste regressie `tests/brain-kansenradar-source-title-hook-coherence-20261103.test.mjs`; protected Required/BRAIN/CodeQL en source readback op exacte SHA, originale Supabase Edge-deploy, 401-unauthenticated-canary en natuurlijke bron-/Notion-uitkomst voordat herstel beweerd mag worden. Geen tweede scheduler, mail, social-publisher of OpenAI-provider.
