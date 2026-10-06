# CI control-plane convergence v2

The pull-request critical path is reduced to the canonical Required gate plus repository-required CodeQL/provider checks. Heavy browser, page/SEO, Quality Intelligence, Skill Projection and Business OS Migration workflows retain post-merge, scheduled or manual coverage without allocating independent pull-request runners.

Central classifiers now use shallow checkout and fetch only the exact comparison base when it is absent. Supabase Preview applicability lives inside Required, including the distinction between function-only and database-relevant `supabase/config.toml` changes. The current-main Netlify governance exception from #3920 is preserved, as is the canonical premerge Netlify build condition.

A bounded missing-gate watchdog recovers only recent PRs with no Required run and preserves PR labels. A conservative janitor closes explicit predecessors only when successor and predecessor share the same Obligation-ID; generated SEO/regulatory/blog/page candidates may additionally be closed after 30 days of staleness.

The obsolete `full_assurance` branch variant is deliberately excluded.
