# 2026-09-30 — Bilingual SEO sitemap replay recovery

Obligation: `bilingual-seo-sitemap-replay-recovery-2026-09-30`.

Base main: `88befad39c99524eebe8f6cf3bc9369c5597b87b`.

The bilingual SEO production chain now has five ordered stages that must stay aligned in CI:
1. localized NL/EN route generation;
2. revenue internal-link projection;
3. sitemap regeneration from final HTML;
4. locale/revenue validation;
5. release evidence.

The canonical replay test was still pinned to the previous three-stage chain and therefore produced a false red after the architecture extension. The replay now validates ordered invariants rather than one obsolete exact command substring.

Closure: Brain learning, human change documentation and this development-ledger entry are part of the same recovery lineage.
