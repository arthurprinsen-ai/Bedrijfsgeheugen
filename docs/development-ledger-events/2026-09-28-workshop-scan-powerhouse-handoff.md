# Development ledger — workshop scan Powerhouse handoff — 2026-09-28

- Obligation: `workshop-scan-powerhouse-handoff-20260928`
- Scope: website + Powerhouse scan ingest + portal handoff
- Parent lineage: workshop scan delivery from PR #3142
- Added an idempotent workshop submission key.
- Added no-PII persistence from `/scan` to the canonical `/api/powerhouse-scan-ingest` path.
- Extended canonical scan ingest to accept `/scan` as `workshop_scan` while preserving the existing `frisse_blik` contract.
- Added partner/workshop/event/UTM attribution to the persisted scan payload.
- Added `bg_scan_pakket` projection so the existing customer portal can consume the workshop result as its first nulmeting on the same browser.
- Changed the primary result continuation and PDF QR from pricing-first to portal-first; pricing remains a secondary commercial path.
- Projected the rule into `.agents/skills/seo-revenue-growth/SKILL.md`.
- Added Brain learning and regression coverage.
- Privacy boundary: participant PII stays in the consented lead path; aggregate Powerhouse scan persistence contains no participant name/e-mail.
