# Homepage toggle browser navigation resilience

The exact-head browser lane for PR #3766 failed twice at the same `page.goto(... networkidle ...)` boundary after all preceding browser checks were green. The toggle contract did not fail on a DOM, interaction, content, geometry, or accessibility assertion; it failed because the preview never satisfied a global network-idle condition within 90 seconds.

The check now uses bounded navigation retry with `domcontentloaded` and explicit visibility of both homepage toggle tabs as readiness. Existing physical-click and panel-state assertions remain unchanged, so real UI defects still fail closed.
