# 22 oktober 2026 — bronherleiding mobiele CLS zonder release-bypass

**Obligation:** `website|cls-attribution-exact-browser-proof|20261022-v1`  
**Canonical incident:** `website|mobile-cls|en-blog-afas-api|20261022-v1`  
**Parent:** #4215; gerelateerd aan bestaande SEO-PR #4606 (ongewijzigd)

Exact-head Required #39740060787 op SEO-PR #4606: checkoutcontrole ging bij de herstart groen, maar de volledige sitemapcontrole vond mobiel CLS `0.111` op `/en/blog/afas-api`; limiet `0.100`. De oorspronkelijke fout had geen getraceerde DOM-verschuivingsbron. De gebouwde statische EN-pagina was al vertaald; de hero-video is absoluut gepositioneerd. Geen bewezen CSS-root cause.

Wijziging: lees in de bestaande browser `PerformanceObserver(layout-shift)` maximaal 12 recente monsters met `sources`, elementtype/id/klassen en afgeronde vorige/nieuwe rechthoeken. Bij de **ongewijzigde** CLS-foutmelding maximaal 8 monsters/1.800 tekens toevoegen. Geen nieuwe netwerkrequests, snapshots, gevoelige inhoud, routes, browserwaivers, scheduler of andere writer.

De originele website blijft rood totdat het veroorzakende element bewezen is en een bronfix de volledige telefoon/tablet/desktop- en sitebrede regressie, beveiligingschecks en productiereadback haalt. Dit commit is alleen instrumentatie, geen claim van een gerepareerde layout.
