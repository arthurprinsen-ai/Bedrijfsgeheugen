# Company Intelligence OS v1 — 2026-09-28

## Change

Powerhouse is formalized as an **AI-native Company Operating System / Company Intelligence Platform** above CRM and source applications.

The architecture now has five explicit, shared layers:

1. Company Graph
2. System of Context
3. Autonomous Action Layer
4. Outcome Memory
5. Compound Intelligence

The canonical loop is:

`Know → Understand → Decide → Act → Observe → Learn → Compound`

CRM, LinkedIn, ERP, accounting, analytics, documents, external intelligence and future connectors feed evidence and context. They do not become competing reasoning authorities.

## Implementation

- Brain module: `brain/company-intelligence/company-intelligence-os.mjs`
- Contract: `brain/contracts/company-intelligence-os-v1.json`
- Supabase migration: `supabase/migrations/20260928193000_powerhouse_company_intelligence_os_v1.sql`
- Skill: `.agents/skills/powerhouse-company-intelligence-os/SKILL.md`
- System Map: `platform/system-map/canonical-system-map.mjs`
- Tests: `tests/company-intelligence-os-v1.test.mjs`

## Runtime model

No parallel CRM, action queue or learning database was created. The Company Graph and context are derived from existing canonical stores. Autonomous execution continues through the existing Powerhouse action and agent fabric. Outcome Memory normalizes observed outcomes and realized value only. Compound Intelligence requires verified outcomes to influence later decisions.

## Safety and truth boundaries

- estimates/forecasts remain separate from realized value;
- external side effects retain existing identity, channel, consent and human-authorization gates;
- context and graph projections retain canonical lineage;
- sensitive-person inference remains forbidden;
- learning is incomplete until it can alter a future priority, prediction, policy or next-best-action.
