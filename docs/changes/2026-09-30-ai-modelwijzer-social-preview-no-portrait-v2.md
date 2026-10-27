# AI Modelwijzer social preview zonder persoonlijk portret

De AI Modelwijzer gebruikte een klein vierkant merklogo als Open Graph-afbeelding. LinkedIn kan een te kleine preview-afbeelding negeren en vervolgens zelf een grotere afbeelding van de pagina of site kiezen. Daardoor kon een persoonlijk portret op de LinkedIn-bedrijfspagina verschijnen.

De pagina forceert nu de grote Bedrijfsgeheugen-bedrijfsbanner als social preview via `og:image`, `og:image:secure_url`, `image_src` en `twitter:image`, met een cache-busted URL.

Persoonlijke portretten zijn geen geldige previewbron voor de AI Modelwijzer of vergelijkbare Bedrijfsgeheugen-bedrijfspagina's.
