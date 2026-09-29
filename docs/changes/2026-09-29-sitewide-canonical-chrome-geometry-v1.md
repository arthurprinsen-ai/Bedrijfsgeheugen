# Sitewide canonical website chrome geometry

Date: 2026-09-29

## Change

Bedrijfsgeheugen now uses one CMS-like geometry contract for every public page.

- Header/navigation/footer inner width: 1220px on desktop.
- Navigation height: 72px.
- “Meer” mega-menu: viewport-centered, max 1190px.
- Solutions mega-menu: 850px.
- Central desktop/mobile gutters.
- Representative public routes are browser-compared for pixel parity.

## Governance

No page may introduce its own header, navigation, footer or mega-menu geometry. Changes to these measurements are sitewide design-system changes and require regression coverage plus Powerhouse learning/System Map writeback.
