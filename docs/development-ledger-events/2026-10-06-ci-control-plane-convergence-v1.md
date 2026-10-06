# 2026-10-06 — CI control-plane convergence v1

Obligation: ci-control-plane-convergence-20261006-v1

Evidence observed before the change:
- Required and Skill Projection used fetch-depth: 0 and fetched the repository's complete remote branch set.
- PR #3911 allocated independent browser, page/SEO, quality and skill runners while Required already owned release-lane classification.
- The repository search returned at least 100 open pull requests.
- Supabase Preview provider verification was already embedded in Required, making the global applicability workflow redundant.

Prevention installed:
- bounded exact-base fetches;
- duplicate heavy PR fanout removed;
- standalone Supabase applicability runner retired;
- missing Required gate watchdog;
- conservative superseded/stale-generated PR janitor;
- executable regression coverage.

Additional live evidence:
- #3928 and #3929 were concurrent candidates for the same Obligation-ID and main epoch; #3929 was retired as the non-canonical duplicate.
- missing-gate recovery must preserve PR labels because admission/routing may be label-sensitive.

Additional prevention:
- one canonical open machine PR per Obligation-ID, preferring `TERMINAL_DELIVERY` authority;
- robust `Supersedes:` parsing for plain, `#`-prefixed and multiple PR numbers;
- paginated, label-preserving Required watchdog.
