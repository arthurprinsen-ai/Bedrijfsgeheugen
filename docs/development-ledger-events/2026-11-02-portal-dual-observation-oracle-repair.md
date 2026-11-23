# Append-only source event — original Portal dual observation regression

- Date: 2026-11-02.
- Parent incident: #4439; related protected live Portal PR #5282; original #5255 observation reader.
- Exact observed failure: original GitHub run 41433667027, backend job 125238718390; 5400 total / 5397 pass / 1 failed / 2 skipped. Index 3050 stale historical UI copy matcher.
- Root: test expected one ambiguous label while current protected Portal has two distinct failed-history and later-software-recovery labels.
- Fix source: replace only old label oracle with two current labels and assert escaped later absolute GitHub proof; keep actual Portal/UI/API code untouched.
- Prevention/skills: `.agents/skills/powerhouse-post-merge-codeql/SKILL.md`, historical + shadow + canary of original two tests; fail-closed admin-only, no false business-green, no side effects.
- Owner: original ONE BRAIN admin-only Portal source and SkillOps. This is a candidate until protected CI, independent postmerge BRAIN and provider readback prove closure.
