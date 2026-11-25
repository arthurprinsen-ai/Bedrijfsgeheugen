# Proefknoppen op /prijzen via de generator

- De build schrijft de inhoud van `/prijzen` en `/en/prijzen` opnieuw met `apply-commercial-pricing-v1`. De knoppen "Start 30 dagen gratis" stonden alleen in de bronpagina en verdwenen daardoor live.
- De generator zet nu bij Starter, Pro en Groei de knop "Start 30 dagen gratis" (met `trial=1`), dezelfde knop onderaan en een korte uitleg over de proefperiode.
- De Engelse pagina krijgt "Start 30 days free" en `lang=en` op de afsluit-links.
