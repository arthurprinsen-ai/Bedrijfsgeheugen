---
name: personal-linkedin-life-only
description: Enforce Arthur's personal LinkedIn as a strictly personal-life channel and route all business topics to the company page.
---

# Personal LinkedIn — personal life only

Fingerprint: `personal-linkedin-personal-life-only-v1`.

## Hard rule

Arthur's personal LinkedIn is exclusively for personal life and lived personal observations. It must not contain company, client, MKB, consultancy, assignment, business-process, organizational AI/digitalization, Bedrijfsgeheugen, sales, lead, offer, case, thought-leadership or business-lesson content.

A personal anecdote may never be used as a wrapper or bridge to a business message.

## Allowed source worlds

Family and parenting; children and school; hockey/sport; travel/holiday; car/transport; home/garden; consumer technology; shopping/daily services; family/generations; leisure; daily routines/frustrations; ordinary human observations.

## Source rules

External trends, search data, forums or news may suggest personal themes but may never invent an Arthur experience. First-person claims require verified personal source lineage.

## Fail-closed publication gate

Before publication require:
- exact personal channel identity;
- verified first-person source;
- concrete lived personal event in final copy;
- `personalLifeOnlyVerified=true`;
- no business/corporate/consultant signal;
- no forced business moral;
- copy not interchangeable with the company page.

Business exceptions are not allowed. If a topic is business-oriented, route it to LinkedIn company or rewrite from a genuinely personal topic.

## Learning

Keep personal-profile performance separate from company-page performance. Optimize personal LinkedIn for recognition, humor, conversation and personal engagement, not commercial conversion.


## Provider capability proof (2026-09-22)

Fingerprint: `linkedin-composio-capability-proof-v1`.

- A LinkedIn connection in an external dashboard is not sufficient publication evidence. Powerhouse must read the active provider connection itself.
- Personal posting identity must be resolved through the authenticated LinkedIn member identity before any provider side effect.
- Company-page posting capability must be proven separately from personal capability; do not infer organization permissions from a personal connection.
- Capability discovery is read-only and runs before the canonical social publisher. The publisher remains the sole writer and all existing personal-truth, daily-channel and dedupe gates remain mandatory.


## Composio tool-version execution rule (2026-09-22)

Fingerprint: `composio-v31-tool-execution-v1`.

- Direct Composio tool execution must use the v3.1 API surface (or an explicitly pinned modern toolkit version); never rely on v3's base-version default for current social tools.
- Connected-account ACTIVE state and tool execution success are separate proofs. A provider is usable only after the required read/write tool succeeds under the canonical account.
