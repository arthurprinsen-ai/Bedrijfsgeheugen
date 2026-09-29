# LinkedIn company standard delivery v1

Date: 2026-09-29

Bedrijfsgeheugen LinkedIn now has one inherited delivery contract for content identity, historical uniqueness, OAuth authority and recovery.

## Permanent rules

- Company LinkedIn uses business/CEO/MT subjects only.
- Personal-life/household/printer-style content is rejected before generation.
- `printer` is retired across LinkedIn identities after explicit user feedback.
- Production Powerhouse/Composio state is the canonical OAuth authority; chat-local connector state is diagnostic.
- `ACTIVE` metadata is insufficient without live token health.
- Safe auth repair occurs inside the same daily claim; Buffer and Make remain forbidden.
- If the user explicitly deletes a bad company post, the story remains consumed and at most one materially different same-day replacement may be published.
- A successful provider create URN remains the anti-duplicate fence.

This rule is inherited through AGENTS.md, the LinkedIn publication skill, Brain policy/learning and the Powerhouse System Map.

## Final inheritance projection
The permanent rule is projected into both `AGENTS.md` and `.agents/skills/linkedin-composio-publisher/SKILL.md` under obligation `linkedin-company-standard-delivery-20260929`.
