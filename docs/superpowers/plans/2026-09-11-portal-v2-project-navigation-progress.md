# Portal V2 Project Navigation Progress

Implemented on `feature/portal-v2-project-navigation`:

- global mobile navigation contract now uses `Project -> hub:project`;
- canonical `Jouw project` hub with five approved context groups;
- grouped project entries for offerte, uren/facturen, koppelingen, integraties, taken/werkstromen, documenten, notities, activiteit and team/toegang;
- fail-closed project cockpit model and renderer;
- project context tabs in the existing hub sheet;
- desktop `Jouw project` section with both group and item level navigation;
- mobile labels are sourced from the navigation model, removing the old hardcoded `Portaal` label;
- responsive/touch-target styling;
- contract tests for navigation and project cockpit.

Delivery remains fail-closed: no merge/live claim until CI and production readback are green on exact SHAs.
