# LinkedIn Revenue Cockpit — Design

## Goal
Build one production cockpit that turns existing Powerhouse/Notion commercial signals into at most 12 high-value human-executed actions across LinkedIn comments, LinkedIn DM, email, WhatsApp and calling.

## Architecture
The cockpit is part of Bedrijfsgeheugen and is not a separate CRM. It consumes the existing Notion commercial state and never invents LinkedIn feed or DM content. LinkedIn execution stays human-in-the-loop: open source URL, copy suggested text, send manually, then confirm outcome for writeback.

## Privacy boundary
The production route is `/intern/linkedin-revenue/`, under the existing Netlify Edge Basic Auth boundary for `/intern/*`. Real contact, CRM and DM data must never be committed to this public repository as a static snapshot.

Runtime data is queried server-side from Notion with the already configured `NOTION_TOKEN`; no secret value is exposed to the browser. The runtime endpoint independently validates the existing `INTERN_GEBRUIKER` and `INTERN_WACHTWOORD` Basic Auth so its direct function URL cannot bypass the internal boundary. All cockpit responses use `private, no-store`, `noindex` and deny framing.

Canonical Notion data sources:
- Connecties-kern: `3b2da36a-ac8a-80f1-a78d-000b4766fd4c`
- Onbeantwoorde-berichten: `3b2da36a-ac8a-80c4-a392-000b0f6d3b2f`
- Commentaarplan — warm-up voor de DM: `0c7f1516-1e2f-42f9-9f15-4b0081de8e7a`
- DM-teksten — concepten uit de Radar: `b3a5793e-b314-4faa-90e2-d1357f23804e`

Use Notion API `POST /v1/data_sources/{data_source_id}/query` with `Notion-Version: 2025-09-03`.

## Decision contract
Each action requires a real person/contact, source or relationship signal, explicit channel, why-now rationale and safe next-best-action. Maximum 12 actions. Score is 0–100.

Priority order:
1. `Bal ligt bij = Zij wachten op mij` plus `Prioriteit = 1 — Nu`;
2. incoming reaction / DM or `Drive Status = Nu`;
3. fresh grounded post/comment opportunity;
4. overdue follow-up;
5. other high-confidence revenue actions.

Cooldown and `Niet benaderen` suppress an action.

## Grounding gate
Fail closed when context is insufficient:
- `https://www.linkedin.com/feed/` is not a concrete source URL.
- No concrete post/thread source plus no personalization evidence means no send-ready text.
- No actual conversation context means no context-aware DM reply.
- Generic Radar text such as `Hoi , ik zag jullie uitvraag...` is not send-ready.
- Missing context yields `Context aanvullen`, not fabricated outreach copy.

A send-ready suggestion requires a concrete person, real profile/post/thread source, contextual evidence and non-generic personalized text.

## UX
Top section: `Vandaag` with maximum 12 action cards. Supporting lanes: `Inbox & DM`, `Connecties`, `Posts`, `Follow-up`, `Revenue`.

Each action card shows person/company/role, 0–100 score, why now, channel, evidence state, suggested text only when evidence-safe, potential value/confidence when available, and direct controls: Open LinkedIn, Copy text and Open Notion.

Desktop and mobile use the same data contract and action order.

## Safety and platform rules
No background LinkedIn scraping. No automated comments/DMs/likes. No DOM overlay injection. The module may only deep-link to a concrete LinkedIn URL and prepare grounded text for the user to copy/send manually.

## Failure behavior
- Missing Notion token or inaccessible data source: capability failure, never a fake empty-success state.
- Partial Notion failure: preserve successful lanes and expose `sourceHealth` diagnostics.
- Authentication failure: HTTP 401.
- Ungrounded candidate: visible as blocked/context-needed, never ready-to-send.

## Testing
Contract tests verify route, six lanes, maximum-12 behavior, generic-feed rejection and grounded-text requirement. Runtime tests verify normalization, ranking, auth and partial-source failure behavior.

## Release
Release through the existing independent delivery lane and required PR gates. Merge only the exact tested head. Production is complete only after the authenticated cockpit route works and unauthenticated access is denied.