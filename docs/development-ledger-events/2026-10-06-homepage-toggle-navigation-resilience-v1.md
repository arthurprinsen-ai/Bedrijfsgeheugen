# 2026-10-06 — homepage toggle browser navigation resilience

- Source: PR #3766 Required run `37427956203`.
- Failed browser jobs: `112155463173` and rerun `112158418114`.
- Both failures: `page.goto: Timeout 90000ms exceeded` in `homepage-toggle-browser-check.mjs`.
- Prior checks were green, including 753 public-page visibility/CLS checks, header contrast, megamenu, UI visual regression and homepage context slider.
- Structural fix: replace `networkidle` dependency with three-attempt `domcontentloaded` navigation plus explicit toggle-DOM visibility readiness.
- Functional click/state/content assertions remain fail-closed.
