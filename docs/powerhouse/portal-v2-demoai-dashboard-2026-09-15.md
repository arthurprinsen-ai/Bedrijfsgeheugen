# Portal V2 demoAI cockpit — canonical implementation note

Date: 2026-09-15

## Authority

The public demo URL `https://www.bedrijfsgeheugen.nl/klantportaal?klant=demoAI` remains a Netlify rewrite into the existing `portal-v2/` application. Portal V2 remains the only customer portal authority. No parallel portal, data store, brain, queue or learning system was added.

## Change

The legacy `demoAI` query route is now explicitly recognized as a demo route by `portal-v2/portal-state.js`. Demo snapshots are normalized with `state.portal.klant = "demo"`, which activates the existing `portal-v2/modules/overview-demo.js` cockpit. Normal customer routes remain outside this demo gate.

The approved management-cockpit visual language is route-scoped through `portal-demo-ai` and the stylesheet entry point `portal-v2/demoai-dashboard.css`, which imports `demoai-shell.css` and `demoai-overview.css`. The route-specific theme provides the dark Bedrijfsgeheugen navigation rail, compact light management cockpit, screenshot-aligned card density and grid, blue accents, radar/donut/sparkline presentation, right-side action area and responsive tablet/mobile layout.

The generic Portal V2 overview blocks are hidden only inside the demo route so the existing demo cockpit is the single overview surface. Underlying Portal V2 routing, page shell, CSRD, Data & AI, compliance, project, action and Powerhouse capabilities remain available.

## Test contract

`tests/portal-v2-demoai-route.test.mjs` proves that `?klant=demoAI` is recognized case-insensitively, `?klant=ijsselmonde` is not treated as demo, the demo client publishes the canonical `portal.klant` marker, and the route-scoped responsive theme files are present.

## Rollback

Rollback is limited to reverting the Portal V2 demoAI commits. No schema migration, destructive data change, DNS change, new service or external dependency is introduced.

## Closed-loop requirement

Production status may only be marked LIVE & BEWEZEN after the PR is merged, Netlify production has deployed the merged commit, the public demo URL is read back successfully, and the resulting evidence is written to the existing Powerhouse learning/documentation lineage.
