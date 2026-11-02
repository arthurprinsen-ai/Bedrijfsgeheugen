# Page/SEO original writer: avoid date-only candidate churn

Date: 2026-11-02. Owner: original ONE BRAIN Page/SEO writer. P0 incident #4439 and original candidate PR #5294, run #41439896307.

## Observed failure
The native Page/SEO run checked 89 public browser pages and found no errors, but its final candidate PR creation was rejected by GitHub: `GitHub Actions is not permitted to create or approve pull requests`. The preexisting candidate branch `writer/paginacontrole/32f1dc3d678d31a4` changed only the `bijgewerkt` date in `seo-status.json`. Protected attempt #41440843638 first failed invalid candidate-type metadata (corrected in the same PR) and then correctly rejected missing machine Brain learning, activity ledger, and human documentation.

## Root cause and scoped prevention
The source `.github/scripts/seocontrole.py` wrote `date.today()` on every successful run, making a new git diff even when the canonical SEO ownership/pillars were unchanged. `schrijf_seo_status_als_gewijzigd` now preserves the prior semantic update date and does no write if the normalized output is byte-for-byte identical. A **real** change in SEO keyword owners or pillar structure still updates the timestamp and produces a canonical candidate. Regression replay `tests/brain-page-seo-status-delta-handoff-20261102.test.mjs` proves both behaviors and verifies the original fail-closed GitHub control plane is retained.

## Security and verification
No second scheduler, agent or writer; no broad OAuth/token rights, no forced merge, no disallowed scope expansion in the runtime generator, no fabricated issue closure or paid order. The original PR #5294 is the authorized existing branch handoff with explicit enlarged **review scope** for source correction, Brain learning, documentation, original SEO skill and regression. Its protected checks and Netlify readback must independently pass before saying live.

**Still unresolved:** genuine future SEO content changes still require PR creation by an authorized canonical repository writer or carefully scoped installation-token configuration; the current GitHub Actions token is forbidden. Do not hide this exception or mark the Page/SEO workflow historically green. The separate 90 medium/18 low SEO improvements remain open, as do business-outcome proofs. Publish operational status only to authenticated original operations views, never as raw internal jargon in entrepreneur/customer public copy.
