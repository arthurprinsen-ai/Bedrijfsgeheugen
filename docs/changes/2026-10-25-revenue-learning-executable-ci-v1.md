# Revenue Learning premerge regression coverage — 2026-10-25

The new bounded/observed-only learning in PR #4851 had a dedicated regression at tests/brain-revenue-learning-fair-verified-20261025.test.mjs. The existing focus suite matched only tests/revenue-learning-*.test.mjs; generic green Required was not evidence that this precise new fixture executed.

Reuse .github/workflows/revenue-learning.yml with a scoped pull_request trigger. Add the existing regression test explicitly to the suite. This is a CI event only; no new production scheduler, executor, provider credentials or recipient sends are introduced.

Acceptance: exercise both positive/negative cases in an actual GitHub Actions job, Required+CodeQL at exact HEAD, protected merge, Netlify deploy for functional source, and subsequently observe the actual hourly evaluator before claiming autonomously applied revenue learning.
