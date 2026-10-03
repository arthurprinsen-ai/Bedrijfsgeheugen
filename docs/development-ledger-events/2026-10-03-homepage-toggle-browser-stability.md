# Homepage toggle browser stability — 2026-10-03

Obligation: `homepage-toggle-browser-stability-20261003-v1`

Observed twice in the protected website browser lane:
- `#homepage-platform-tab` was visible and enabled;
- the fixed header brand and later the floating `bgx-lek` aside intercepted pointer events after automatic scroll;
- all preceding route, visibility, shell and visual-regression checks were green.

Closure:
- preserve physical click semantics;
- center target before click;
- allow layout to settle;
- retry boundedly three times;
- prohibit force-click;
- executable historical replay guards the contract.
