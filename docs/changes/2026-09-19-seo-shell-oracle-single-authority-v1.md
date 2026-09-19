# SEO shell-oracle ownership

- Obligation-ID: seo-shell-oracle-single-authority-v1
- Incident: page/SEO runs reported estate-wide header/footer drift while canonical shell contract, full-build and live-readback were green on the same candidate.
- Root cause: legacy Python SEO logic reimplemented shell equality using raw HTML fragment comparison.
- Fix: SEO checker now owns SEO/keyword/cluster/sitemap concerns only. Canonical shell truth remains owned by `tools/controleer-site-ui.mjs` and the canonical shell workflows.
- Safety: no canonical shell gate is removed or weakened; duplicate contradictory authority is removed.
- Status: RECOVERABLE_INCOMPLETE until protected merge/current-main readback.
