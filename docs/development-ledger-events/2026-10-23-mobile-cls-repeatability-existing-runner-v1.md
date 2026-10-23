# 2026-10-23 — canonical issue #4451 mobile CLS repeatability
- Source issue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4451
- Existing prior fix: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4651
- Existing daily workflow: .github/workflows/website-cross-browser-screenshot-assurance.yml
- Material edit: pure replay contract + existing screenshot-assurance runner + config, regression, BRAIN learning, change note
- Fail closed on any CLS >0.100 or missing sample; no threshold change, second scheduler, or repeat-only exception
- Production repeatability and exact-head CI/CodeQL: pending
