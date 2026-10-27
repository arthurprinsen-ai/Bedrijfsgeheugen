# Development ledger — Netlify governance-only build skip

- Date: 2026-10-06
- Obligation: netlify-governance-ignore-20261006-v1
- Observed waste: #3911 produced a 126-second production deploy for a CI release-risk policy change.
- Root cause: `site/website-release-risk.json` was not in Netlify's governance-only exact-path set.
- Change: add that exact file to `governanceExact`.
- Safety: real website/runtime paths remain fail-open to a Netlify build.
- Regression: `tests/brain-netlify-governance-ignore-v1.test.mjs`.
