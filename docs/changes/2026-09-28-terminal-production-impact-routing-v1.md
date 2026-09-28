# Terminal production-impact routing v1

## Probleem

Terminal closure gebruikte deels de delivery-lane als proxy voor productie-impact. Daardoor kon een backend/control-plane wijziging wachten op `Production Release Readback`, terwijl beide canonical production workflows die wijziging via `paths-ignore` bewust niet starten.

## Oplossing

Powerhouse classificeert terminal production impact nu op gewijzigde paden. De ignore-set is gelijk aan de canonical productie-triggercontracten.

- Alleen ignored/control-plane paden: terminal proof = protected-main containment.
- Minstens één production-bearing pad: Netlify/provider/readback blijft verplicht.
- Gemengde kandidaten blijven fail-closed production-bearing.

Hiermee verdwijnt een structurele terminal-wachttijd zonder production assurance te verlagen.
