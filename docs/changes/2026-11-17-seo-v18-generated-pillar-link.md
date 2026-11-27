# 17 november 2026 — oorspronkelijke V18-renderer herstellen voor gerichte interne SEO-links

**Waarom deze correctie nodig is:** Na de live SEO-verbetering voor AFAS en Lightspeed bleek dat de landingspagina `/afas-koppeling` wél correct online stond, maar de nieuwe relevante link op de overkoepelende pagina `/systemen-koppelen` niet. De productie gebruikt niet de oude losse HTML als bron: de oorspronkelijke V18-sitegenerator bouwt die pagina na elke release opnieuw vanuit een bestaande view. Een aanpassing aan de oude HTML verdwijnt daardoor bij de volgende build.

**Kleine, structurele oplossing:** De bestaande V18-weergavelijst bepaalt nu expliciet welke relevante interne link bij de koppelingspagina hoort: **Lightspeed-webshop naar AFAS**. De oorspronkelijke generator bouwt de link zichtbaar en toegankelijk in de werkelijke productie-HTML en faalt als die ontbreekt. Zo is er één SEO-eigenaar en een echte interne route, zonder nieuwe landingspagina of zoekwoordconcurrentie.

**Onderhoud & regressie:** De renderer staat in `tools/v18-seo-context-links.mjs`; de weergavelijst in `tools/v18-views-lijst.mjs`. De builder voert de controle uit vóór wegschrijven; de tests controleren canonical eigenaarschap, veilige links, juist label, uitzonderingen en Engelse vertaling.

**Aantoonbaar live:** Alleen na beschermd main-merge, exact Netlify READY en onafhankelijke publieke HTML-crawl met de nieuwe zichtbare ankertekst. Echte extra bezoekers, leads, sociale publicaties en verzonden e-mails blijven onbewezen totdat de originele providers hun data terugmelden. Geen geforceerde status in ONE BRAIN; de oorspronkelijke #175 bronmanifestoverdracht blijft apart geregistreerd.
