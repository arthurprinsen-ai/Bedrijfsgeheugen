# 2026-08-29 — V18 test route reconstruction

- Type: IMPROVEMENT
- Scope: test-only website reconstruction
- Source: accepted V18 deploy `6a918685f3737c0008ee981a`, commit `195d30e411a327553f81be40815d4c0d8da4e98d`, plus user-supplied V18 Meer screenshots.
- Rule: V18 page wins when present; otherwise preserve current production page; write a new page only when the V18 link has no existing page.
- Preserved: current production Blog and all production-only routes on branch base.
- Added missing V18-linked pages: Partners, Onderzoeken, Templates & tools, Security, Juridisch, Helpcentrum, Changelog, plus V18 primary/account routes.
- Safety: no production merge, no credential/secret/permission changes, no destructive data changes.
- Verification: exact-head PR workflow and Netlify preview required before declaring green.
