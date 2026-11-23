# Oorspronkelijk incident: checkout voordeelregel verdwijnt uit gebouwde DOM

- **Moment:** 2026-11-02, productiebron 79d99ce9d03068dae3c909707d00dde1933f9d78.
- **Bewijs:** Pagina/SEO browser run 41430693011, één echte TypeError op /afsluiten na canonical sitebuild. Browserlocatie 3332:2603. 89 pagina's, één blokkade. Losse SEO-kwaliteitsschuld: 90 midden en 18 laag.
- **Root cause:** optionele informatienode niet beschikbaar tijdens render. Exact producerende bouwstap nog onbekend, dus hypothese niet als feit vastleggen.
- **Eigenaar:** oorspronkelijke checkout runtime + Page/SEO CI + ONE BRAIN, geen nieuwe scheduler.
- **Herstel:** alleen ontbrekende pakketvoordelen idempotent recreëren in oorspronkelijke plan-UL; checkoutformulier en betaalbron nooit nabootsen.
- **Regressie:** tests/brain-checkout-benefit-dom-recovery-20261102.test.mjs, bestaande checkout-build en taalgates, originele BRAIN, Required, CodeQL en post-merge browser/Netlify. Het is nog geen bewezen productieherstel totdat die controles slagen.
- **Preventie:** standaard browsercontrole op alle betaalpagina's voor elke release en no-recurrence op volgende originele run. Agent-skill powerhouse-seo-conversion-orders bijgewerkt. Incident blijft OPEN/OBSERVED tot onafhankelijk bewijs.
