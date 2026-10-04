# Website CLS and cross-browser interaction recovery — 2026-10-04

Production baseline evidence showed 247 public routes, 592 render checks, 24 interaction checks and 73 failures. The dominant defect was cumulative layout shift in the shared header; interaction checks also referenced stale selectors.

Recovery PR #3660 landed on main at `570fa09f8309c7685bd52b12f3d369d3cd952f40`.

The shared header now reserves the final desktop language and mobile Menu geometry before JavaScript. The browser harness targets canonical `/product` and the real header controls. CLS remains fail-closed at 0.1; thresholds were not widened. PR assurance targets the exact Netlify preview and the scheduled assurance targets production.
