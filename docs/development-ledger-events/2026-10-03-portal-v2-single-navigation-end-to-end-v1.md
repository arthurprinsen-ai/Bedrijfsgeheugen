# Portal V2 single navigation — activity ledger

Date: 2026-10-03  
Obligation: portal-v2-single-navigation-end-to-end-v1

Implemented:
- canonical navigation tree is projected from the complete Portal V2 page registry;
- desktop sidebar now contains every registered page, grouped in one scrollable tree;
- Jouw project remains reachable as an item inside that same tree;
- the separate desktop project navigation block is no longer mounted;
- the five-item mobile bottom navigation is removed;
- desktop no longer shows a second full-menu button;
- tablet/mobile show one hamburger only when the persistent sidebar is unavailable;
- the responsive drawer uses the same canonical navigation groups and pages;
- router active state is exact-page based through one data-nav-target contract;
- regression and production-navigation tests now guard the single-navigation invariant.

Expected result:
one end-to-end Portal V2 experience with one information architecture, one page authority and one menu model across desktop, tablet and mobile.
