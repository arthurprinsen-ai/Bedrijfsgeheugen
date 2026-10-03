# Portal single navigation — activity ledger

Date: 2026-10-03  
Obligation: portal-single-navigation-end-to-end-v1

Implemented:
- removed the separate desktop all-pages navigation layer from the active portal flow;
- removed the reduced standalone mobile shortcut navigation;
- stopped the extra Business OS navigation injection from loading as a second authority;
- made the existing sidebar render the complete grouped `PORTAL_SECTIONS` tree;
- made mobile reuse the same grouped navigation builder in one responsive drawer;
- kept page URL/history on the canonical `?page=` contract;
- made the long desktop menu independently scrollable;
- added regression coverage that fails when another navigation authority is reintroduced.

Expected result:
one end-to-end portal experience with one information architecture and one menu model across every page and viewport.
