---
name: linkedin-personal-life-only
description: Mandatory Powerhouse content skill for generating, reviewing, routing or publishing Arthur's personal LinkedIn content.
---

# LinkedIn Personal — Personal Life Only

Fingerprint: `personal-linkedin-personal-life-only-v1`.

## Hard boundary

Arthur's personal LinkedIn profile is exclusively for personal life. Business content is never allowed, including when wrapped in a personal anecdote.

Allowed domains include family, children, school, hockey and sport, travel, cars, home and garden, consumer technology, family/generations, leisure, daily routines, frustrations and ordinary human situations.

Blocked domains include companies, customers, MKB, consultancy, assignments, business processes, Bedrijfsgeheugen, organizational AI/data/digitalization, sales, leads, offers, cases, management lessons and any bridge from a private anecdote to a business lesson.

There is no business exception and no one-off override on the personal channel. Route business topics to `linkedin_company`.

## Source gate

A personal source is eligible only when evidence proves:
- `personal_truth_verified=true`;
- `personal_life_topic=true`;
- `personal_life_only=true`;
- `business_topic=false`;
- `business_bridge=false`;
- first-person claims and Arthur anchor are verified;
- sensitive private details have explicit approval when required.

External data may suggest themes and recurring personal frustrations, but may never fabricate an Arthur first-person experience.

## Final-copy gate

Final copy must contain a concrete first-person lived event and must contain no business/company/consultancy/organizational bridge. Ambiguity fails closed as `BLOCK_PERSONAL_CHANNEL`.

## Learning separation

Personal-profile performance and learning remain separate from LinkedIn company-page ranking and commercial scoring.

## Canonical implementation

- `config/social-channel-identity-contract.json`
- `platform/social-channel-identity-gate.mjs`
- `supabase/functions/powerhouse-content-orchestrator/index.ts`
- `supabase/functions/bg-pre-publish-review/index.ts`
- `tests/brain-linkedin-personal-semantic-gate-v5.test.mjs`
