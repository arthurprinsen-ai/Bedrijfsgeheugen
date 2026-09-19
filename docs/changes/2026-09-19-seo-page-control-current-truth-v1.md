# SEO page-control current-truth recovery

- Obligation-ID: github-cleanup-page-seo-v1
- Issue: #1448
- Current-main revalidation found four real content defects: pricing "implementatie", product "optimaliseren/optimalisatie", an overlong data-sovereignty title and an overlong pricing meta description.
- The historical /blog/zoekverkeer-stijgt-omzet-niet source path no longer exists.
- The historical /wijzigingen-uitgelegd shell finding was an oracle mismatch: page/browser control used the production-projected tree while SEO compared raw source HTML.
- Fix: clean current content, shorten metadata, keep the auto-fixer aligned, and run SEO checking from the same production build tree.
- No canonical shell safety gate is weakened.
