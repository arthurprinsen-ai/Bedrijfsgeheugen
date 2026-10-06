# CI control-plane convergence v1

The pull-request critical path is reduced to the canonical Required gate plus repository-required security/provider checks. Heavy browser, page/SEO, Quality Intelligence and Skill Projection workflows retain push, schedule or manual coverage but no longer allocate independent pull-request runners.

Full-history checkouts in the central classifiers are replaced with shallow checkouts and exact comparison-base fetches. Supabase Preview applicability is owned only by Required. A bounded missing-gate watchdog recovers absent Required runs, and a conservative PR janitor closes explicit supersessions plus generated candidates stale for more than 30 days.

Safety remains fail-closed: website runtime changes still route through Required -> Website release lane, provider-owned Supabase Preview remains exact-head verified, and watchdog redispatch is limited to recent main-targeting PRs with no existing Required run.
