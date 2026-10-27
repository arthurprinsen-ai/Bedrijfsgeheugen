# 2026-10-12 — portal v2 production-readback stale title recovery
- Merged PR #4347 delivered live portal operating journey at production SHA 51bdf9deec401c0f59e548a938f4b11542c1703d.
- Public live HTML has five working existing page routes and four initially hidden sample sections.
- Post-release Playwright failed two title text assertions; 13 other checks passed; this is stale testing, not evidence of a failed portal route.
- Correct tests to match new canonical category and separately assert the content/customer-source boundaries.
- Maintain existing protected merge, unique menu, auth, backend truth and full screen/browser requirements; no runtime code change or false claim of independently verified savings.
