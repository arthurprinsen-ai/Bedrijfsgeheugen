# LinkedIn Revenue Cockpit — Design

## Goal
Build one production portal module that turns existing Powerhouse/Notion commercial signals into at most 12 high-value human-executed actions across LinkedIn comments, LinkedIn DM, email, WhatsApp and calling.

## Architecture
The cockpit is part of `portal-v2`; it is not a separate CRM. It consumes only existing Bedrijfsgeheugen/Powerhouse state and never invents LinkedIn feed or DM content. LinkedIn execution stays human-in-the-loop: open source URL, copy suggested text, send manually, then confirm outcome for writeback.

## Decision contract
Each action requires a real person/contact, source or relationship signal, explicit channel, why-now rationale and safe next-best-action. Maximum 12 actions. Score is 0–100.

Fail closed when context is insufficient:
- `https://www.linkedin.com/feed/` is not a concrete source URL.
- No concrete post/thread source plus no personalization evidence means no send-ready text.
- No actual conversation context means no context-aware DM reply.
- Missing context yields `Context aanvullen`, not fabricated outreach copy.

## UX
New route: `/portal-v2/linkedin-revenue.html`.

Top section: `Nu doen` with maximum 12 action cards. Each card shows person/company/role, 0–100 score, why now, channel, suggested text when evidence-safe, potential value/confidence when available, and action controls.

Supporting lanes: Inbox, Posts & comments, Connections, Follow-up, Revenue.

## Safety and platform rules
No background LinkedIn scraping. No automated comments/DMs/likes. No DOM overlay injection. The module may only deep-link to an existing concrete LinkedIn URL and prepare text for the user to copy/send manually.

## Testing
Contract tests must verify: route exists; maximum-12 behavior; explicit human-action copy; fail-closed generic-feed handling; no auto-send claims; mobile viewport structure; link from portal overview.

## Release
Release through the existing independent delivery lane and required PR gates. Merge only the exact tested head. Verify production route after Netlify deploy and record production evidence.