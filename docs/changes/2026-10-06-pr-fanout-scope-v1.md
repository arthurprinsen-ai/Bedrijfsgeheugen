# PR workflow fan-out scope — 2026-10-06

Three non-critical PR fan-out sources are narrowed without removing real protection.

1. **Repository Writer Candidate Shadow** is now explicit-dispatch only. Operational Verification already dispatches it with immutable PR/base/head/branch inputs, so the broad pull-request trigger only produced skipped runs on normal PRs.
2. **Pagina- en SEO-controle diagnose** is now manual-only. It remains available through workflow dispatch but no longer rebuilds the site and installs Playwright automatically on unrelated PRs.
3. **Website Cross-Browser Screenshot Assurance** keeps PR, daily scheduled and manual assurance, but excludes `site/website-release-risk.json`, which is delivery control-plane configuration rather than website runtime output.

Protected Required test and CodeQL are unchanged.
